var express = require("express");
var bodyParser = require("body-parser");
var mysql = require("mysql2");
var multer  = require("multer");
var fs = require('fs');
var storage = multer.diskStorage({
destination: function (req, file, callback) {
 callback(null, 'uploads/')
 },
 filename: function (req, file, callback) {
 callback(null, req.body.fname+".jpg")
 }
});
var upload = multer({ storage: storage });
var cMysql = mysql.createPool({
 host: "localhost",
 user: "root",
 password: "*root mysql user password*",
 database: "game_info",
 connectionLimit: 10
 });
var app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static(__dirname + '/images'));

//=====================
// ROUTES
//=====================
// Showing games
app.get("/", function (req, res) {
cMysql.getConnection(function(err,conn){
 if(err){
 console.log("MYSQL: can't get connection from pool:",err)
 }else {
 conn.query('SELECT * FROM allgames;',
 function(er,rows){
 if(er){
 conn.release();
 console.log("MYSQL: ERROR: ",err);
 } else {
 conn.release();
 for (var i in rows) {
 console.log(rows[i].id, rows[i].name, rows[i].publisher, rows[i].developer, rows[i].released, rows[i].rating );
 }
res.render('main', { data: rows });
 }
 });
 }
});
});
///////////////////////////////////////////
app.post("/addgame", upload.single("cover"), function (req, res) {
// req – request, res- result
// извлекаем данные формы (form[method="post"]) по id полей формы
var gamename=req.body.gamename;
var dev = req.body.dev;
var pub = req.body.pub;
var rel = req.body.rel;
var rate = req.body.rate;
// переменная для имени файла
var file_photo_name;
// если пользователь не загрузил фото typeof req.file === "undefined"
if (typeof req.file === "undefined") {
// если фото не загружено, то фото – файл unknown_person.jpg в папке images
 file_photo_name= "images/question-mark.jpg";
// копируем файл unknown_person.jpg' в папку uploads под именем сотрудника req.body.emp_name
fs.createReadStream('images/question-mark.jpg').pipe(fs.createWriteStream('uploads/'+req.body.gamename+'.jpg'));
 }
else {
// иначе работаем с загруженным фото. Файл сохраняется в папку uploads как 'undefined', поэтому
// переименовываем по имени сотрудника req.body.emp_name
fs.renameSync(req.file.path, req.file.path.replace('undefined', req.body.gamename));
file_photo_name= "uploads/"+ req.body.gamename+".jpg";
 }
// формируем подготовленный запрос
var sql = "INSERT INTO allgames SET ?",
 values = {
 name: gamename,
 publisher: pub,
 developer: dev,
 released: rel,
 rating: rate,
 cover:fs.readFileSync(file_photo_name)
 };
// отправляем в базу
cMysql.getConnection(function(err,conn){
 if(err){
 console.log("MYSQL: can't get connection from pool:",err)
 }else {
 conn.query(sql, values,
 function(er,rows){
 if(er){
 conn.release();
 console.log("MYSQL: ERROR: ",err);
 } else {
 conn.release();
 res.end();
 }
 });
 }
});
console.log("Successful game insertion!")
});
//////////////////////////////////////////////////
app.post("/search", function (req, res) {
	    console.log("req is:", req.body.add);
 var query = req.body.add;
cMysql.getConnection(function(err,conn){
 if(err){
 console.log("MYSQL: can't get connection from pool:",err)
 }else {
 conn.query("SELECT * FROM allgames WHERE name LIKE ?;", '%' + query + '%',
 function(er,rows){
 if(er){
 conn.release();
 console.log("MYSQL: ERROR: ",err);
 } else {
 conn.release();
 for (var i in rows) {
 console.log(rows[i].id, rows[i].name, rows[i].publisher, rows[i].developer, rows[i].released, rows[i].rating );
 }
res.render('main', { data: rows });
 }
 });
 }
});
});
app.post("/see", function(req,res){
console.log("test");
console.log(req.body);
});
////////////////////////////////////////////////////////////////////////////////////////////
var port = process.env.PORT || 8080;
app.listen(port, function () {
 console.log("Server Has Started!");
}); 