const res = await fetch('http://localhost:3000/api/faculties');
console.log(res.status);
console.log(await res.text());
