const res = await fetch('http://localhost:3000/api/departments?facultyId=cmqsczkg4000ly3dp0lnv52zo');
console.log(res.status);
console.log(await res.text());
