import pg from "pg";
const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
const r = await c.query(`select l.pid, l.granted, a.state, a.application_name, a.backend_start, now()-a.query_start as running_for, left(a.query,80) q
  from pg_locks l join pg_stat_activity a on a.pid=l.pid where l.locktype='advisory' and l.objid=72707369`);
console.log(r.rows); await c.end();
