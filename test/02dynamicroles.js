var rolepool = require("../rolepool");

var assert = require("assert");

var rp = new rolepool.Rolepool();

var personpool = {};
var people = [
  {
   "username": "daniel",
   "companyname": "",
   "siblings":[]
  },
  {
   "username": "wally",
   "companyname": "GadgetShop",
   "siblings":[]
  },
 {username: "maximillian", siblings: ["millie","marla"]},
 {username: "millie",   siblings: ["maximillian","marla"]},
 {username: "marla", siblings: ["maximillian","millie"]},
 {username: "john",   siblings: ["annie","mandy","sandy","eddie"]}
];
// Index for easy access.
people.forEach(function (p) {
   if (!p.username) {throw "No Username !";}
   personpool[p.username] = p;
});
var gadget;
describe('# Initialize Test Entries', function() {

 gadget = {
  "name": "Gadget X",
  "owner": "daniel",
  "companyname": "GadgetShop",
};

//var userctx_d = ;
//var userctx_v = ;


//console.log(rp);
// console.log(JSON.stringify(rp, null, 2));



});
// Test Dynamic Roles
// Dynamic role callback for role "gadgetowner".
// This callback gets attached to role at the time of role initialization.
// 
function is_gadgetowner (userctx,ctx) {
  console.log("Test gadgetowner for " + userctx.username + " ...");
  if (userctx.username == ctx.owner) {
     console.log("- owner based on primary ownership");
     return 1;
  }
  else if (userctx.companyname == ctx.companyname) {
     console.log("- owner based on company");
     return 1;
  }
  console.log("- Not an owner of any kind");
  return(0);
}
// User - to another user comparison for two users being siblings.
// Two way check is done, not just relying one claiming to be sibling (!)
function is_sibling(userctx,ctx) {
   // Test Type-Compatibility
   if (!Array.isArray(userctx.siblings)) {throw userctx.username + " Does not have siblings";}
   if (!Array.isArray(ctx.siblings)) {throw "Does not have siblings";}
   console.log("Test if user " + userctx.username + " is a sibling  of "+ ctx.username);
   var selfun = userctx.username;
   var sibun = ctx.username;
   if (userctx.username == sibun) {
      console.log("User and Sibling tested seem to be the same person");
      return(0);
   }
   // Do a 2-way check
   var sib_by_self = 0; sib_by_sib = 0;
   if (userctx.siblings.filter(function (it) {return it == sibun;}).length == 1) {
      sib_by_self = 1;
   }
   if (ctx.siblings.filter(function (it) {return it == selfun;}).length == 1) {
     sib_by_sib = 1;
   }
   if (sib_by_self && sib_by_sib) {
     console.log("IS Sibling by a 2-way check");
     //NOT:describe("IS-A Sibling");
     return 1;
   }
   console.log("NOT a Sibling");
   return 0;
}

describe('# Test adding Dynamic Roles', function() {
  it("Add dynamic role 'gadgetowner'", function () {
    rp.addrole("gadgetowner","Gadget Owner", is_gadgetowner);
  });
  it("Add dynamic role 'sibling'", function () {
    rp.addrole("sibling","Sibling", is_sibling);
  });
});
// Note: JSON.stringify() will NOT and can NOT serialize callbacks and functions
// console.log(JSON.stringify(rp, null, 2));
// console.log(rp);

describe('# Test Contexts against dynamic Roles', function() {
  var userctx_d = personpool["daniel"];
  var userctx_v = personpool["wally"];
  var p_maximillian    = personpool["maximillian"];
  var p_millie  = personpool["millie"];
  var p_marla = personpool["marla"];
  var p_john   = personpool["john"];
  var p_oh = {username: "oliver",'siblings':["jack"]};
  it("Test dynamic role 'gadgetowner'", function () {
    rp.getrole("gadgetowner").test(userctx_d, gadget);
    rp.getrole("gadgetowner").test(userctx_v, gadget);
    rp.getrole("gadgetowner").test(p_oh, gadget);
  });
  it("Test dynamic role 'sibling'", function () {
    rp.getrole("sibling").test(p_john, p_maximillian);
    rp.getrole("sibling").test(p_maximillian, p_millie);
    rp.getrole("sibling").test(p_oh, p_john);
  });
});

// console.log(dynok);
