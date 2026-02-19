export async function onRequest({ env }) {

  const { results } = await env.DB
    .prepare("SELECT * FROM logs ORDER BY id DESC LIMIT 500")
    .all();

  let rows = "";

  for (const item of results) {
    rows += `
      <tr>
        <td>${item.id}</td>
        <td>${item.slug}</td>
        <td>${item.ip}</td>
        <td>${item.referer}</td>
        <td>${item.ua}</td>
        <td>${item.create_time}</td>
      </tr>
    `;
  }

  return new Response(`
  <html>
  <head>
    <meta charset="UTF-8">
    <title>访问日志</title>
    <style>
      body{font-family:Arial;padding:20px}
      table{width:100%;border-collapse:collapse}
      td,th{border:1px solid #ddd;padding:6px;font-size:12px}
    </style>
  </head>
  <body>
  <h2>访问日志</h2>
  <table>
  <tr>
    <th>ID</th>
    <th>Slug</th>
    <th>IP</th>
    <th>Referer</th>
    <th>UA</th>
    <th>时间</th>
  </tr>
  ${rows}
  </table>
  </body>
  </html>
  `,{
    headers:{ "content-type":"text/html;charset=UTF-8" }
  });
}
