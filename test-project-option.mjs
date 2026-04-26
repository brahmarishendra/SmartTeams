import pg from 'pg';
const { Client } = pg;
const connectionString = 'postgresql://postgres:P75NNzI3Vgr9Zulk@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?options=project%3Dipuksbnsyqqssqtherbb';
const client = new Client({ connectionString });
async function test() {
  try {
    console.log('Testing ap-south-1 with project option...');
    await client.connect();
    console.log('Connected!');
    await client.end();
  } catch (e) {
    console.error(e.message);
  }
}
test();
