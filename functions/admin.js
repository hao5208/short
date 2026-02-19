export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "123456";
  const pwd = url.searchParams.get("pwd");

  if (!pwd || pwd !== ADMIN_PASSWORD) {
    return new Response("Forbidden", { status: 403 });
  }

  // ===== 删除 =====
  if (url.searchParams.get("delete")) {
    const id = url.searchParams.get("delete");

    await env.DB.prepare("DELETE FROM links WHERE id = ?")
      .bind(id)
      .run();

    return Response.redirect(
      new URL(`/admin?pwd=${ADMIN_PASSWORD}`, request.url),
      302
    );
  }

  // ===== 修改 =====
  if (request.method === "POST") {
    const form = await request.formData();
    const id = form.get("id");
    const newUrl = form.get("url");

    if (id && newUrl) {
      await env.DB.prepare("UPDATE links SET url = ? WHERE id = ?")
        .bind(newUrl, id)
        .run();
    }

    return Response.redirect(
      new URL(`/admin?pwd=${ADMIN_PASSWORD}`, request.url),
      302
    );
  }

  // ===== 列表 =====
  const { results } = await env.DB
    .prepare("SELECT * FROM links ORDER BY id DESC")
    .all();

  let rows = "";

  for (const item of results) {
    rows += `
      <tr>
        <td>${item.id}</td>
        <td>${escapeHtml(item.slug)}</td>
        <td>
          <a href="${escapeHtml(item.url)}" target="_blank">
            ${escapeHtml(item.url)}
          </a>
        </td>
        <td>${item.status ?? 1}</td>
        <td>${escapeHtml(item.create_time)}</td>
        <td>
          <a href="/admin?pwd=${ADMIN_PASSWORD}&delete=${item.id}"
             onclick="return confirm('确定删除？')">
             删除
          </a>
          <button 
            data-id="${item.id}" 
            data-url="${escapeHtml(item.url)}"
            onclick="showEdit(this)">
            修改
          </button>
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
      body{font-family:Arial;padding:20px;background:#f5f6fa}
      table{width:100%;border-collapse:collapse;background:#fff}
      td,th{border:1px solid #ddd;padding:8px}
      th{background:#eee}
      button{margin-left:5px;cursor:pointer}
      #editBox{display:none;margin-top:20px}
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
    function showEdit(btn){
      document.getElementById("editBox").style.display="block";
      document.getElementById("editId").value=btn.dataset.id;
      document.getElementById("editUrl").value=btn.dataset.url;
      window.scrollTo(0,document.body.scrollHeight);
    }
  </script>

  </body>
  </html>
  `, {
    headers: { "content-type": "text/html;charset=UTF-8" }
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
