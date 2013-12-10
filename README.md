# Mashape Database Client

I've created this client so that it would be extremely easy to consume the Mashape Database API. This client provides the following features:

* Easily to load entities
* Lazy-load any third party reference
* Configurable caching to improve performance.
* Utility methods to retrieve the `primary` or `parent` field for every entity
* Utility methods to directly `update()` or `delete()` and entity

# Usage

Initialize the client libary by specifying the Redis host and port:

```javascript
var client = new Client("127.0.0.1", 6379, true); // Debug is set to true
```

## Load entities

```javascript
client.get("http://192.168.50.5:8080/mashape-apis-database-server/v1/accounts/mashaper", function(user) {
  console.log(user);
});
```

## Lazy-Load references

```javascript
client.get("http://192.168.50.5:8080/mashape-apis-database-server/v1/accounts/mashaper", function(user) {
  user.profile(function(profile) {
    console.log(profile);
  });
});
```

## Primary and parent utility methods

Get primary:

```javascript
client.get("http://192.168.50.5:8080/mashape-apis-database-server/v1/accounts/mashaper", function(user) {
  user.primary(function(primary) {
    console.log(primary);
  })
});
```

Get parent

```javascript
client.get("http://192.168.50.5:8080/mashape-apis-database-server/v1/accounts/mashaper", function(user) {
  user.profile(function(profile) {
    profile.parent(function(parentUser) {
      console.log(parentUser);
    })
  });
});
```

## Update an entity

```javascript
client.get("http://192.168.50.5:8080/mashape-apis-database-server/v1/accounts/mashaper", function(user) {
  user.email = "updated@mashape.com";
  user.update();
});
```

or 

```javascript
client.update("http://192.168.50.5:8080/mashape-apis-database-server/v1/accounts/mashaper", {email:"updated@mashape.com"});
```

## Delete an entity
```javascript
client.get("http://192.168.50.5:8080/mashape-apis-database-server/v1/accounts/mashaper", function(user) {
  user.delete();
});
```
or

```javascript
client.delete("http://192.168.50.5:8080/mashape-apis-database-server/v1/accounts/mashaper");
```

