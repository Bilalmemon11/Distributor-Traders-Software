const fs = require('fs');

let file = 'C:/xampp/htdocs/qadri/backend/resources/views/pdf/receipt.blade.php';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<\/style>/, '.receipt { font-size: 22px; font-weight: bold; color: #1e3a8a; margin-top: 15px; }\n</style>');
fs.writeFileSync(file, content);

let file2 = 'C:/xampp/htdocs/qadri/backend/resources/views/pdf/vendor-payment-receipt.blade.php';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/<\/style>/, '.receipt { font-size: 22px; font-weight: bold; color: #1e3a8a; margin-top: 15px; }\n</style>');
fs.writeFileSync(file2, content2);
