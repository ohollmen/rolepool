////////////// Role ////////////////////////////
"use strict;";
// var console; // Do NOT declare JS global objects (seems to have side effect of undefining them and treating them local) !
// jsdoc -d jsdoc/ --readme README.md --verbose rolepool.js

/* Constructor for role
* @constructor
* @param roleid - Role identifier
* @param rolename - Descriptive name for role
* @param dyncb - Contextual callback for dynamic role
*/
function Role(roleid, rolename, dyncb) {
  if (!roleid) { throw "No id for role"; }
  this.roleid = roleid;
  this.rolename = rolename || "N/A"; // Empty str ?
  if (dyncb) {
    // Allow string form function to be resolved ?
    // Test that we indeed have function
    if (typeof dyncb !== "function") { throw "Role tester CB is not a function"; }
    this.cb = dyncb;
  }
  else { this.mems = {}; }
}
Role.prototype.addmem = function (memid) {
  if (!memid) { throw "addmem(): No memid (or passed as empty)"; }
  this.mems[memid] = 1; // ++ ?
};
// Do we need this ? cb should be enough flag to indicate this and external users
// should not be concerned with this.
Role.prototype.isdyn = function () {
  if (this.cb) { return 1; }
  return 0;
};
// Test dynamic role.
// Always expect userctx to be complete user context object (not just an ID).
Role.prototype.test = function (userctx, objctx) {
  if (!this.cb) { throw "Dynamic role evaluation requested, no cb found !"; }
  return this.cb(userctx, objctx);
};

Role.prototype.ismem = function (userid) {
  if (this.cb) { throw "Static role membership tested, but dynamic role cb was found !"; }
  return this.mems[userid] ? 1 : 0;
};
////////////////////////////////////////////////////////
/** Create a rolepool.
 * Rolepool is a container for roles and members attached to them.
 * This creates an empty stub with no member assignments (for static roles).
 * Dynamic roles evaluate users "contextual" or "dynamic" role.
 * @param {object} opts - Options object with callbacks for converting userid to usercontext and
 * usercontext to userid (Callbacks names "touserctx" and "touserid" respectively)
 * @constructor
 */
function Rolepool(opts) {
  opts = opts || {};
  // Description of all roles
  // Attach members to these roles
  this.roles = {};
  // Index of users to roles (needed ?)
  this.strict = 0;
  this.lastupdate = 0;
  this.autocreate = 0; // Allow automatic on-the-fly creation of roles
  // Userid / Usercontext converter Defaults
  // Bothe ways default to use userid as property to define user identity.
  this.touserid = function (obj) { return obj.userid; }; // Use property username
  this.touserctx = function (id) { return {userid: id}; };
  if (opts.touserid) {this.touserid = opts.touserid; }
  if (opts.touserctx) {this.touserctx = opts.touserctx; }
}

/** Rolepool population methods. To be used at application init.
 *
 */

/** Add Role by id and descriptive name.
 * If role is a dynamic role an optional dynamic role evaluator needs to be passed.
 * @param {string} roleid - Role ID
 * @param {string}  rolename - Descriptive name for the role
 * @param {function} rolecb - Optional role evaluator callback necessary for a dynamic role.
*/
Rolepool.prototype.addrole = function (roleid, rolename, rolecb) {
  if (this.roles[roleid]) { throw "Role '" + roleid + "' already exists"; }
  this.roles[roleid] = new Role(roleid, rolename, rolecb);
};
/** Add static member */
//Rolepool.prototype.addmem = function (roleid, memid) {
//   var role = this.getrole(roleid);
//   if (!role) {return;}
//   role.mems[memid] = 1;
//}

/** Add a new member to a (static) role.
 * If rolepool setting autocreate is set to true, the assignment to a non-existing (basically missing) role
 * is not an error, but the role is created on-the fly by addmem() here.
 * With no autocreate exception is thrown for a missing role.
 * Also passing empty or false memid triggers an exception.
 * @param {string} roleid - Role id
 * @param {string} memid - Member id
 * @todo See the need to consider missing role as error (?)
 */
Rolepool.prototype.addmem = function (roleid, memid) {
   // TODO: multiple roles or have separate addusertoroles()
   
   // I case of array JS would coerce Array to comma separated list
   var role = this.getrole(roleid);
   // Autocreate roles on-the fly
   if (!role && this.autocreate) {
      role = this.addrole(roleid, "Untitled auto-added Role");
   }
   if (!role) { throw "No role by '" + roleid + "'"; }
   // Add missing check originating from a data bug:
   // addmem() should be not allowed on dynamic role !!
   if (role.cb) {throw "addmem(): Role Member population not allowed to a dynamic role";}
   // Allow passing an array of members for convenience
   //if (Array.isArray(memid)) {
   //   memid.forEach(function (mid) {role.addmem(mid);});
   //   return;
   //}
   if (role.mems[memid] && !this.nowarn) { console.log("User '" + memid + "' already has role '" + roleid + "'"); }
   role.addmem(memid);
};

Rolepool.prototype.addtoroles = function (memid, roleids) {
   if (!Array.isArray(roleids)) { throw "Role ID:s not in array"; }
   
};

/** Lookup a role (object) from pool.
 * If Rolepool strict setting is set, an exception will be trown for a
 * missing role (by its id). I non strict mode return null for a missing role.
 * @param {string} roleid - Role id
 * @return The role or null. I strict mode throw an exception for a missing role.
 */
Rolepool.prototype.getrole = function (roleid) {
     var role = this.roles[roleid];
     if (!role) {
       if (this.strict) { throw "Role '" + roleid + "' not there"; }
       return (null);
     }
     return (role);
};
/** Test if user by mem has role given by roleid.
 * @param {string} mem - User/member id as given at the time of addmem(roleid,userid) or user context object
 * @param {string} roleid - Role id as given at the time of addmem(roleid,userid)
 * @param {object} ctx - Optional context for dynamic role
 * @return true for memid having the role, false
 */
Rolepool.prototype.userhasrole = function (memid, roleid, ctx) {
   // Many roles as Array
   if (Array.isArray(roleid)) { return this.userhasoneofroles(memid, roleid, ctx); }
   var role = this.getrole(roleid);
   if (!role) { console.log("No role by " + roleid);return (0); }
   // Dynamic ? Must have callback and context
   if (role.cb) { // should also be function
     var memctx;
     if (!ctx) { throw "Dynamic role evaluation requested, but no comp. context passed !"; }
     if (typeof memid !== 'object') { memctx = role.touserctx(memid); }
     else { memctx = memid; } // Looks acceptable as-is
     // TODO: MUST PASS Complete USERCTX
     return role.cb(memctx, ctx);
   }
   // Static role ...
   // Must have memid scalar to compare. If Object found - convert to scalar
   // typeof item === "object" 
   if (memid && typeof memid === "object") { memid = this.touserid(memid); }
   if (!memid) { throw "No memid for checking the static role " + roleid; }
   if (!role.mems) {console.log("No members for role:" + roleid, role);return(0);}
   if (role.mems[memid]) { // role.ismem(memid)
      if (this.debug) { console.log("Found '" + memid + "' in role '" + roleid + "'"); }
      return (1);
   }
   return (0);
};
/** Test for multiple roles in OR manner (allow any one to match).
 * Even one of the roles listed in roleids will satisfy the role requirement.
 * Note: If a mix of (static and) dynamic roles is tested, the object context for _all_ the
 * dynamic roles must be the same. This also implies 
 * @param {string} memid - User/member id
 * @param {array} roleids - One or more Role ID:s passed in Array
 * @return The (first) role (name/label) that user was found to have during testing
 */
Rolepool.prototype.userhasoneofroles = function (memid, roleids, ctx) {
   var i = 0;
   if (!Array.isArray(roleids)) { throw "Roles to be tested not in array"; }
   // Use for(...) to be able to short-circuit at first match
   for (i = 0; i < roleids.length; i++) {
      var r = roleids[i];
      if (this.userhasrole(memid, r, ctx)) { return r; }
   }
   return null;
};
/** Test for multiple roles in AND manner (require all roles to be valid).
* User has to have all 
*/
Rolepool.prototype.userhasallofroles = function (memid, roleids, ctx) {
   var i = 0;
   if (!Array.isArray(roleids)) { throw "Roles to be tested not in array"; }
   // Use for(...) to be able to short-circuit at first non- match
   for (i = 0; i < roleids.length; i++) {
      var r = roleids[i];
      // Any case of does-not-have-role fails AND op
      if (!this.userhasrole(memid, r, ctx)) { return 0; }
   }
   return 1;
};

/** Convert "raw" JSON data to rolepool objects.
 * Allow client side to "cast" raw data into a fully usable rolepool object.
 * @return rolepool object (same as the first data parameter passed, but now recognized as Rolepool instance)
 */
Rolepool.fromdata = function (rp, opts) {
  opts = opts || {};
  var debug = opts.debug;
  if (debug) {console.log("ROLEPOOL:" + JSON.stringify(rp, null, 2));}
  // TODO: 
  rp.__proto__ = Rolepool.prototype;
  rp.touserid =   function (userctx) {return userctx.userid;};
  if (debug) {
    console.log(rp);
    console.log(Rolepool);
  }
  var ks = Object.keys(rp.roles);
  if (debug) {console.log("ROLEPOOL-roles:" + JSON.stringify(ks, null, 2));}
  ks.forEach(function (rlbl) {
    var r = rp.roles[rlbl];
    r.__proto__ = Role.prototype;
    if (r.cbs) {r.cb = eval(r.cbs);} // Dynamic role in JSON context
    //console.log(rp.roles[rlbl]);
  });
  // Test
  //console.log("userhasrole is :"+rp.userhasrole);
  //console.log("hasrole:"+rp.userhasrole($rootScope.currentUser, 'admin')); // {'userid':153}
  return(rp);
};
/* Reset all static members within rolepool.
 * Handy to have operation when relaoding all role members (to not have stale / removed members stay in roles).
 * @return Number of roles that were reset.
 */
Rolepool.prototype.resetallmem = function () {
   var roles = this.roles;
   var ks = Object.keys(roles);
   if (!Array.isArray(ks)) {return 0;} // Implies no members
   var i = 0;
   ks.forEach(function (k) { roles[k].mems = {}; i++;}); // Reset each to empty
   return i;
};
// Possibly have this get complete userctx ?
// Rolepool.prototype.userctxhasctxrole = function (memid_or_memctx, roleid, ctx) {
//};
//var module;
// { exports: {} } would be better (and avoid object access via null), but
// The testing for window is better yet.
//if (!module) {module = { exports: null}; }
//module.exports.Role = Role;
//module.exports.Rolepool = Rolepool;
var window;
if ( ! window) { module.exports = {Role: Role, Rolepool: Rolepool}; }
// ... else leave Role,Rolepool as globals in Browser runtime
