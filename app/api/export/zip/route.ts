import { NextResponse } from "next/server";
import { deflateRawSync } from "zlib";
import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { auditForCompany } from "@/lib/audit";

function crc32(data: Buffer): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipEntry(name: string, content: string): { local: Buffer; central: Buffer; size: number } {
  const nameBytes = Buffer.from(name, "utf-8");
  const raw = Buffer.from(content, "utf-8");
  const compressed = deflateRawSync(raw);
  const crc = crc32(raw);

  const local = Buffer.alloc(30 + nameBytes.length + compressed.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(raw.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);
  local.writeUInt16LE(0, 28);
  nameBytes.copy(local, 30);
  compressed.copy(local, 30 + nameBytes.length);

  const central = Buffer.alloc(46 + nameBytes.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(0, 12);
  central.writeUInt16LE(0, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(raw.length, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  central.writeUInt16LE(0, 30);
  central.writeUInt16LE(0, 32);
  central.writeUInt16LE(0, 34);
  central.writeUInt16LE(0, 36);
  central.writeUInt32LE(0, 38);
  nameBytes.copy(central, 46);

  return { local, central, size: local.length };
}

function buildZip(files: { name: string; content: string }[]): Buffer {
  const entries: { local: Buffer; central: Buffer }[] = [];
  let offset = 0;

  for (const f of files) {
    const entry = zipEntry(f.name, f.content);
    entry.central.writeUInt32LE(offset, 42);
    entries.push(entry);
    offset += entry.local.length;
  }

  const cdOffset = offset;
  const cdSize = entries.reduce((s, e) => s + e.central.length, 0);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([
    ...entries.map((e) => e.local),
    ...entries.map((e) => e.central),
    eocd,
  ]);
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const company = await loadCompany(user.companyId);
  const audit = await auditForCompany(company.id);

  const zip = buildZip([
    {
      name: "company.json",
      content: JSON.stringify(
        { id: company.id, name: company.name, industry: company.industry, headcountRange: company.headcountRange, locations: company.locations, fiscalYearEndMonth: company.fiscalYearEndMonth, sectionStatus: company.sectionStatus, createdAt: company.createdAt },
        null,
        2
      ),
    },
    {
      name: "emissions_calcs.csv",
      content: toCSV(
        company.calcs.map((c) => ({
          scope: c.scope,
          category: c.category,
          co2e_tons: c.co2eTons,
          market_based_tons: c.marketBasedTons ?? "",
          factor_id: c.factorId ?? "",
          formula: c.formula,
          basis: c.basis,
        }))
      ),
    },
    {
      name: "qb_transactions.csv",
      content: toCSV(
        company.qbTransactions.map((t) => ({
          id: t.id,
          vendor: t.vendor,
          category: t.category,
          amount_usd: t.amount,
          date: t.date,
        }))
      ),
    },
    {
      name: "utility_data.csv",
      content: toCSV(
        company.utilityData.map((u) => ({
          location_id: u.locationId,
          month: u.month,
          kwh: u.kwh,
          therms: u.therms,
        }))
      ),
    },
    {
      name: "audit_log.csv",
      content: toCSV(
        audit.map((r) => ({
          timestamp: r.ts,
          user: r.userName,
          section: r.section,
          field: r.field,
          previous: r.prev,
          new_value: r.next,
          factor_id: r.factorId ?? "",
          formula: r.formula ?? "",
        }))
      ),
    },
  ]);

  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="greentrack-export-${company.id}.zip"`,
    },
  });
}
