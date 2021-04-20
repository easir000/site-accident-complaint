var express = require("express");
var accessRouter = express.Router();
var bodyParser = require("body-parser");
var authenticate = require("../authenticate");
var Notification = require("../models/Notifications.js");
const Table = require("../models/tables");

accessRouter.use(bodyParser.json());

//Get edit access access info for a particular table for an user
accessRouter
  .route("/editAccess")
  .get(authenticate.verifyUser, (req, res, next) => {
    var user = req.user;
    var table = req.query.table;
    Table.findById(table)
      .then((table) => {
        if (table) {
          if (table.user.toString() == req.user._id.toString()) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end("You have the access to view this table");
          } else {
            var edit_bool = [];
            edit_bool = table.edit_access.filter((euser) => {
              return euser.toString() == user._id.toString();
            });
            if (edit_bool.length == 0) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              res.end("You do not have the edit access for this table");
            } else {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end("You have the access to edit this table");
            }
          }
        } else {
          var error = new Error("Table with specified id not found");
          next(error);
        }
      })
      .catch((err) => {
        next(err);
      });
  });

accessRouter
  .route("/viewAccess")
  .get(authenticate.verifyUser, (req, res, next) => {
    var user = req.user;
    var table = req.query.table;

    Table.findById(table)
      .then((table) => {
        console.log(table.view_access, user._id);
        if (table) {
          if (table.user.toString() == req.user._id.toString()) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end("You have the access to view this table");
          } else {
            var view_bool = [];
            view_bool = table.view_access.filter((vuser) => {
              return vuser.toString() == user._id.toString();
            });
            console.log(view_bool);
            if (view_bool.length == 0) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              res.end("You do not have view access for this table");
            } else {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end("You have the access to view this table");
            }
          }
        } else {
          var error = new Error("Table with specified id not found");
          next(error);
        }
      })
      .catch((err) => {
        next(err);
      });
  });

accessRouter
  .route("/accessRequest/:tableId")
  .post(authenticate.verifyUser, (req, res, next) => {
    Table.findById(req.params.tableId)
      .populate("user")
      .then((table) => {
        if (table) {
          Notification.create({
            user: table.user._id,
            from_user: req.user._id,
            access_request: req.body.access_request,
            table: req.params.tableId,
            message: `${table.user.username} wants to have ${req.body.access_request} access of the table ${table.tableName}`,
          })
            .then((notification) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end("Request sent successfully");
            })
            .catch((err) => {
              next(err);
            });
        } else {
          var error = new Error();
          error.status = 402;
          error.message = "Table with specified id not found in the database";
        }
      })
      .catch((err) => {
        next(err);
      });
  });
accessRouter
  .route("/approveRequest")
  .post(authenticate.verifyUser, (req, res, next) => {
    Table.findById(req.body.table)
      .then(
        (table) => {
          if (table) {
            console.log(req.body.notification_id);
            if (req.body.access_type.toString() == "Edit") {
              var edit_access = table.edit_access;

              var check = edit_access.filter((user) => {
                return user._id == req.body.user;
              });
              console.log("check");
              if (check == null) {
                edit_access.push(req.body.user);
                table.edit_access = edit_access;
                table
                  .save()
                  .then((table) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(table);
                  })
                  .catch((err) => {
                    next(err);
                  });
              } else {
                var err = new Error();
                err.message("User already has view access to this table");
                next(err);
              }
            } else if (req.body.access_type.toString() == "View") {
              var view_access = table.view_access;
              var check = view_access.filter((user) => {
                return user._id == req.body.user;
              });
              console.log(check);
              if (check.length == 0) {
                console.log(view_access);
                view_access.push(req.body.user);
                table.view_access = view_access;
                table
                  .save()
                  .then((table) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(table);
                  })
                  .catch((err) => {
                    next(err);
                  });
              } else {
                res.send(403, {
                  error: "User already has access available",
                });
              }
            }
          } else {
            var error = new Error();
            error.status = 402;
            error.message = "Table with specified id not found in the database";
          }
        },
        (err) => {
          next(err);
        }
      )
      .catch((err) => {
        next(err);
      });
  });

module.exports = accessRouter;
