// Mocha tests for static roles
// Run with local mocha: export PATH=$PATH:../node_modules/mocha/bin/; mocha 01staticroles.js
// https://coderwall.com/p/dr4uvw/easy-version-publishing-to-npm-via-makefile

var rolepool = require("../rolepool");
// var expect = require("chai").expect; // Consider ...

var assert = require("assert");

var rp = new rolepool.Rolepool();

// Add Roles to assign users into
var ROLES_TOADD = [
  ['admin', "Administrator"],
  ['super', "Super-User"],
  ['kid', "Kid"]
];
// This could come/originate from a table like userroles that
// associates user with patricular roles
var MEMS_TOADD = [
  ["kid", "marla"],
  ["kid", "maximillian"],
  ["kid", "millie"],

  ["admin", "oliver"],
  ["admin", "wally"],
  ["admin", "daniel"],

  ["admin", "millie"], // One user may have more than one roles

  ["super", "god"]
  //[["kid","admin"], "tmulti"] // TODO
];

describe('# Test Adding Roles', function() {
  ROLES_TOADD.forEach(function (item) {
    it("Add '"+item[1]+"' ("+item[0]+") to roles", function () {
      rp.addrole(item[0], item[1]);
    });
  });
});

describe('# Test Adding members to roles', function() {
  MEMS_TOADD.forEach(function (item) {
  it("Add "+item[1]+" to role '"+ item[0]+"'", function () {
    rp.addmem( item[0],  item[1]);
  });
  });
});
describe('# Test Role Pool Composition', function() {
  it("Test / Compare roles and members populated", function () {
    var treefn = "./roletree1.json";
    var rtree = require(treefn);
    // console.log(rtree);
    // console.log(JSON.stringify(rp, null, 2));
    //var fs = require('fs');
    //fs.writeFileSync(treefn, JSON.stringify(rp, null, 2));
    // Delete conversion callbacks for testing
    // NOTE: May need to store -restore during testing
    delete(rp.touserid);delete(rp.touserctx);
    assert.deepEqual(rp, rtree, "Trees are equal (exp/actual match)"); // 
  });
});
//var has = rp.userhasrole('maximillian','kid');
// console.log("Ret:" + has);
//if (has) {
//   console.log("User maximillian is a kid indeed");
//}
describe('# Test getting Role', function() {
   it("Get admin role and check rolename", function () {
     //rp.strict = 1;
     //assert.equal(1, rp.userhasrole('maximillian','kid'));
     var ar = rp.getrole("admin");
     // console.log(ar);
     // it("Role has name 'Administrator'", function () {  });
     assert.equal("Administrator", ar.rolename);
     
   });
   it("Get non-existing role (strict, throws exception)", function () {
      rp.strict = 1;
      assert.throws(function () { rp.getrole("bullshitter"); });
   });
   it("Get non-existing role (non-strict, fails silently)", function () {
      rp.strict = 0;
      assert.doesNotThrow(function () { rp.getrole("bullshitter"); });
   });
});

describe('# Test userhasrole()', function() {
  it('maximillian is a kid', function() {
    assert.equal(1, rp.userhasrole('maximillian','kid'));
    // ok(rp.userhasrole('maximillian','kid'));
  });
  it("maximillian is not super", function () {
    assert.equal(0, rp.userhasrole('maximillian','super'));
  });
  it("god is super", function () {
    assert.equal(1, rp.userhasrole('god','super'));
  });
});


describe('# Test multiple roles by userhasoneofroles() (OR-op) and userhasallofroles() (AND-op)', function() {
  it('maximillian is either a kid or admin (OR)', function() {
    assert.equal("kid", rp.userhasoneofroles('maximillian',['kid','admin']));
    // ok(rp.userhasrole('maximillian','kid'));
  });
  it("millie has all roles: 'kid','admin' (AND)", function () {
    assert.equal(1, rp.userhasallofroles('millie',['kid','admin']));
  });
});
