import pg from 'pg';
const { Client } = pg;
const connectionString = 'postgresql://postgres.ipuksbnsyqqssqtherbb:P75NNzI3Vgr9Zulk@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });
async function test() {
  try {
    await client.connect();
    console.log('Connected!');
    await client.end();
  } catch (e) {
    console.error(e);
  }
}
test();
