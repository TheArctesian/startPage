#[macro_use]
extern crate rocket;
use rocket::{get, http::Status, serde::json::Json};
use serde_json::{Number, Value};

#[get("/")]
fn hello() -> Result<Json<String>, Status> {
    Ok(Json(String::from("Rocket server is running")))
}


#[get("/todo")]
fn hello() -> Result<Json<String>, Status> {
    Ok(Json(String::from("Hello from rust and mongoDB")))
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![hello])
}
