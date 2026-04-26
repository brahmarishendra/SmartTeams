import pg from 'pg';
const { Client } = pg;
const connectionString = 'postgresql://postgres.ipuksbnsyqqssqtherbb:P75NNzI3Vgr9Zulk@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
const client = new Client({ connectionString });
async function test() {
  try {
    console.log('Testing session pooler on 5432...');
    await client.connect();
    console.log('Connected!');
    await client.end();
  } catch (e) {
    console.error(e.message);
  }
}
test();
