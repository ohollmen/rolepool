# rolepool - Manage Application roles in modeled fashion.

## What is role pool ?

Many applications depend on some kind of access control facility where
role of the user needs to be tested to access a piece of application functionality.

Rolepool divides the roles to 2 categories:

- Static roles (context independent roles)
  - These are stored as "memberships" of roles that are effectively grouped list of users
  - Role members are "populated" to roles with (rolepool) api calls.
  - A practical application would likely store these in JSON files or database
    and populate the Rolepool object with these role memberships.
- Dynamic roles (contextual roles)
  - These are dependent on a context (Object) against which a comparision is done
  - There is no group or list of users associated to these roles (in Rolepool object)
  - Behind the scenes a callback is consulted to see if user has the role or not



## Static Roles

Setting up static roles is done with API call:

    var rp = new rolepool.Rolepool();
    // Add role by label 'admin'
    rp.addrole('admin', 'Administrator for App X');
    // Add member to role
    rp.addmem( 'admin',  'jsmith');

Note: Rolepool does not have its own preference what the format (string, number, ...)
of the user identifiers used within rolepool are as long as they are unique unambiguos identifiers for particular user.
The following would work (if app conventions mandated so):

    // Questionable convention, but okay with with only single 'John Smith'
    rp.addmem( 'admin',  'John Smith');
    // ...
    if (rp.userhasrole('John Smith','admin')) {...} // true
    
    // E.g. Use DB originated ID
    rp.addmem( 'admin',  4588);
    // ...
    if (rp.userhasrole(4588,'admin')) {...} // true

## Dynamic Roles

Set up a dynamic role (no members, but MUST have tester callback)

    // Rolepool may contain both static and dynamic roles
    var rp = new rolepool.Rolepool();
    // Populate static role into pool
    rp.addrole('admin', 'Administrator for App X');
    // Populate dynamic role to *same* pool
    var is_admin_of_facility = function (user, fac) {
      // Validate facility
      if (!Object.isObject(fac)) {throw "Need facility Object (Not even an object)";}
      if (!Array.isArray(fac.admins)) {throw "Need list of admins for facility";}
      // Relatively simple cmp. - can be often much more elaborate
      if (fac.admins.indexOf(user.username) > -1) {return(1);}
      return(0);
    };
    // Note last parameter
    rp.addrole('adminof', 'Administrator for Facility', is_admin_of_facility);

Testing for dynamic role (vs. static role) using rolepool initialization above:

    // Roles initialized
    // ...
    // test for static role - 2 parameters
    var roleok = rp.userhasrole('jsmith','admin');
    // Test for dynamic role - MUST have 3rd parameter for comparasion context
    var facility_object_inst = {
      'name': "Lab 3rd floor",
      'admins': ['jsmith','bjohnson']
    };
    // Will work, as we pass context parameter properly
    var roleok = rp.userhasrole('jsmith','adminof', facility_object_inst);
    // This would throw error as comparison context is missing (!)
    // Will not work - will throw an error
    rp.userhasrole('jsmith','adminof'); // Missing context for dynamic role !
    // Alternative notation for the same
    rp.getrole("adminof").test('jsmith', facility_object_inst);
    
    
For more examples on dynamic role scenarions, see test cases in test/ in module
distribution.

## User context and userid resolvers

Rolepool method userhasrole() is overloaded to accept either username or user context
(Object) for presenting the user. Rolepool will convert between the two intelligently
with internally setup 2 resolver callbacks:

- touserid - Lookup userid from userctc (or from somewhere else)
- touserctx - Create / Lookup usercontext from a userid

These callbacks can be passed in opts Object when constructing Rolepool:

    var opts = {
      touserid:  function (userctx) { return userctx.userid; },
      touserctx: function (userid)  { return globaluserobject; }
    };
    var rp = new Rolepool(opts);

After this initialization, these callbacks will be automatically used in
underlying role detection operations.

