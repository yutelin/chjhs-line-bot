var firebase = require('firebase');
require('dotenv').config();
var config = {
  apiKey: process.env.FirebaseApiKey,
  authDomain: process.env.FirebaseAuthDomain,
  databaseURL: process.env.FirebaseDatabaseURL,
  projectId: process.env.FirebaseProjectId,
  storageBucket: process.env.FirebaseStorageBucket,
  messagingSenderId: process.env.FirebaseMessagingSenderId
};
const app = firebase.initializeApp(config);
const db = firebase.database();
module.exports = {
  endDb: function (){
    db.goOffline()
  }
  ,
  insertId: function (classId, id) {
    db.ref(`${classId}/ids/${id}`).set(true);
  }

  ,

  removeId: function (classId, id){
    db.ref(`${classId}/ids/${id}`).remove();
  }

  ,
  findId : function (classId) {
    // Get the documents collection
    return db.ref(`${classId}/ids`).once('value').then((snapshot)=>{
      if (snapshot && snapshot.val()){
        return Object.keys(snapshot.val());
      }
      else {
        return [];
      }
    });
  }
  ,
  insertContent : function(classId, dayString, contentString){
    return db.ref(`${classId}/content`).set({dayString: dayString, contentString: contentString});
  }
  ,
  cleanContentDb : function (classId){
    // Get the documents collection
    return db.ref(`${classId}/content`).remove();
  }
  ,
  findLastestContent: function (classId) {
    return db.ref(`${classId}/content`).once('value').then((snapshot)=>{
      return snapshot.val();
    });
  }
  ,
  removeIdFromAllClass: function(id){
    db.ref().once('value').then((snapshots)=>{
      snapshots.forEach((snapshot) => {
        const classId = snapshot.key;
        db.ref(`${classId}/ids/${id}`).remove();
      });
    });
  }


};
