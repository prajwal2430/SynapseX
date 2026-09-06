import sqlite3

db_path = "adeip.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Show actual tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print("Tables found:", tables)

# Show counts before deletion
for t in tables:
    cur.execute(f"SELECT COUNT(*) FROM [{t}]")
    print(f"  {t}: {cur.fetchone()[0]} rows")

print("\nDeleting evidence-related data in safe FK order...")

# Delete in dependency order (children first)
safe_order = [
    "processing_jobs",
    "chain_of_custody",
    "extracted_entities",
    "investigation_events",
    "correlation_signals",
    "investigation_correlations",
    "audit_events",
    "analysis_jobs",
    "evidence",
]

for table in safe_order:
    if table in tables:
        cur.execute(f"DELETE FROM [{table}]")
        print(f"  Deleted from {table}: {cur.rowcount} rows")
    else:
        print(f"  Skipped (not found): {table}")

conn.commit()
print("\nDone. Verification:")
for t in tables:
    cur.execute(f"SELECT COUNT(*) FROM [{t}]")
    print(f"  {t}: {cur.fetchone()[0]} rows")

conn.close()
