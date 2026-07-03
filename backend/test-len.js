const s = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /api/contacts/104/history</pre>
</body>
</html>
`;
console.log(Buffer.from(s).length);
