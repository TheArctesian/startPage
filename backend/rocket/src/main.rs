#[macro_use]
extern crate rocket;
use rocket::{get, http::Status, serde::json::Json};
// use serde_json::{Number, Value};

#[get("/")]
fn hello() -> Result<Json<String>, Status> {
    Ok(Json(String::from("Rocket server is running")))
}


#[get("/todo")]
fn todoHeader() -> Result<Json<String>, Status> {
    Ok(Json(String::from("Todo is working")))
}

#[get("/todo/school")]
fn todoSchool() -> Result<Json<String>, Status> {
    Ok(Json(String::from("school todo sample")))
}

#[get("/todo/watch")]
fn todoWatch() -> Result<Json<String>, Status> {
    Ok(Json(String::from("to watch sample")))
}

#[get("/todo/read")]
fn todoRead() -> Result<Json<String>, Status> {
    Ok(Json(String::from("to read sample")))
}

#[get("/todo/make")]
fn todoMake() -> Result<Json<String>, Status> {
    Ok(Json(String::from("to make sample")))
}
#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![hello])
    .mount("/todo", routes![todoHeader])
    .mount("/todo/school", routes![todoSchool])
    .mount("/todo/watch", routes![todoWatch])
    .mount("/todo/read", routes![todoRead])
    .mount("/todo/make", routes![todoMake])
}
