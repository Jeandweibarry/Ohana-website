const supabaseUrl = 'https://xhrdruicvegglvzjnzva.supabase.co';
const supabaseKey = 'sb_publishable_LZErDqo-5ZrfN9LY_G5aJQ_PYb31hcA';
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  const url = `${supabaseUrl}/rest/v1/Account?select=username,password,user_type&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    let userInfo = 'No user data found';
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const user = data[0];
        userInfo = `Username: ${user.username}, Password: ${user.password}, User Type: ${user.user_type}`;
      }
    } else {
      userInfo = 'Error loading user data';
    }

    const templatePath = path.join(__dirname, 'home.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    html = html.replace('{{userInfo}}', userInfo);

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
}