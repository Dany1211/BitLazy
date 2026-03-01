require('dotenv').config({ path: '.env.local' });
async function check() {
  const res = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY }
  });
  const data = await res.json();
  const models = data.data.map(m => m.id);
  console.log("Vision Models:", models.filter(m => m.includes('vision')));
}
check();
