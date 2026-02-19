export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // 简单后台密码（建议加）
  const pwd = url.searchParams.get("pwd");
  if (pwd !== "123456") {
    return new Response("403 Forbidden", { status: 403 });
  }

  /* =========================
     删除功能
  ========================== */
  if (url.searchParams.get("delete")) {
    const id = url.searchParams.get("delete");

    await env.DB
      .prepare("DELETE FROM links WHERE id = ?")
      .bind(id)
      .run();

    return Response.redirect("/admin?pwd=123456", 302);
  }

  /* =========================
     修改功能
  ========================== */
  if (method === "POST") {
    const form = await request.formData();
    const id = form.get("id");
    const newUrl = form.get("url");

    await env.DB
      .prepare("UPDATE links SET url = ? WHERE id = ?")
      .bind(newUrl, id)
      .run();

    return Response.redirect("/admin?pwd=123456", 302);
  }

  /* =========================
     列表页面
  ========================== */
  const { results } = await env.DB
    .prepare("SELECT * FROM links ORDER BY id DESC")
    .all();

  let rows = "";

  for (const item of results) {
    rows += `
      <tr>
        <td>${item.id}</td>
        <td>${item.slug}</td>
        <td><a href="${item.url}" target="_blank">${item.url}</a></td>
        <td>${item.status ?? 1}</td>
        <td>${item.create_time}</td>
        <td>
          <a href="/admin?pwd=123456&delete=${item.id}" onclick="return confirm('确定删除？')">删除</a>
          <button onclick="showEdit(${item.id}, '${item.url}')">修改</button>
        </td>
      </tr>
    `;
  }

  return new Response(`
  <html>
  <head>
    <meta charset="UTF-8">
    <title>链接管理</title>
    <style>
      body{font-family:Arial;padding:20px}
      table{width:100%;border-collapse:collapse}
      td,th{border:1px solid #ddd;padding:8px}
      button{cursor:pointer}
      #editBox{display:none;margin-top:20px;padding:10px;border:1px solid #ccc}
    </style>
  </head>
  <body>

  <h2>链接管理</h2>

  <table>
  <tr>
    <th>ID</th>
    <th>Slug</th>
    <th>URL</th>
    <th>Status</th>
    <th>时间</th>
    <th>操作</th>
  </tr>
  ${rows}
  </table>

  <div id="editBox">
    <h3>修改链接</h3>
    <form method="POST">
      <input type="hidden" name="id" id="editId">
      <input type="text" name="url" id="editUrl" style="width:400px">
      <button type="submit">保存</button>
    </form>
  </div>

  <script>
    function showEdit(id, url){
      document.getElementById('editBox').style.display='block';
      document.getElementById('editId').value=id;
      document.getElementById('editUrl').value=url;
      window.scrollTo(0,document.body.scrollHeight);
    }
  </script>

  </body>
  </html>
  `,{
    headers:{ "content-type":"text/html;charset=UTF-8" }
  });
}