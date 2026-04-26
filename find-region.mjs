import pg from 'pg';
const { Client } = pg;
const regions = [
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1',
  'sa-east-1', 'ca-central-1', 'me-south-1', 'af-south-1'
];
const projectId = 'ipuksbnsyqqssqtherbb';
const password = 'P75NNzI3Vgr9Zulk';

async function check() {
  async function attempt(host, label) {
    const connectionString = `postgresql://postgres.${projectId}:${password}@${host}:6543/postgres`;
    const client = new Client({ connectionString, connectionTimeoutMillis: 3000 });
    try {
      console.log(`Checking ${label} (${host})...`);
      await client.connect();
      console.log(`SUCCESS! Host is ${host}`);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log(`${label} failed: ${e.message}`);
    }
  }

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    await attempt(host, `aws-${region}`);
  }
  // Also check gcp pooler
  for (const region of ['us-east-1', 'eu-west-1']) {
    const host = `gcp-0-${region}.pooler.supabase.com`;
    await attempt(host, `gcp-${region}`);
  }
  // Also check fly pooler
  await attempt(`${projectId}.fly.pooler.supabase.com`, 'fly');
  console.log('All attempts failed.');
}
check();
