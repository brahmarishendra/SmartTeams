import pg from 'pg';
const { Client } = pg;
const projectId = 'ipuksbnsyqqssqtherbb';
const password = 'P75NNzI3Vgr9Zulk';
const hosts = [
  `db.${projectId}.supabase.co`,
  `aws-0-ap-south-1.pooler.supabase.com`,
  `aws-0-us-east-1.pooler.supabase.com`,
];

async function run() {
  let client;
  let connected = false;
  for (const host of hosts) {
    const isDirect = host.includes('.supabase.co');
    const port = isDirect ? 5432 : 6543;
    const user = isDirect ? 'postgres' : `postgres.${projectId}`;
    const connectionString = `postgresql://${user}:${password}@${host}:${port}/postgres`;
    try {
      client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
      await client.connect();
      console.log(`Connected to ${host}`);
      connected = true;
      break;
    } catch (e) {}
  }

  if (!connected) {
    console.error('Connection failed');
    return;
  }

  try {
    await client.query('ALTER TABLE public.tasks REPLICA IDENTITY FULL;');
    console.log('Success: Replica identity set to FULL');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}
run();
