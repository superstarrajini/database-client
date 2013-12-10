var unirest = require('unirest'),
  redis = require("redis");

var PRIMARY = "_primary";
var RESERVED_FIELDS = [ "id", "status", "updateDate", "creationDate", "_links", PRIMARY];

var Client = function(redisHost, redisPort) {
  //this.baseUrl = baseUrl;
  this.redisClient = redis.createClient(redisPort, redisHost);
  this.redisClient.on("error", function (err) {
        console.log("Error " + err);
    });
}

Client.prototype.save = function(url, entity, callback) {
  unirest.post(url).form(this._sanitize(entity)).end(callback);  
}

Client.prototype.delete = function(url, callback) {
  this._invalidate(url, function() {
    unirest.delete(url).end(callback);
  });
}

Client.prototype.update = function(url, entity, callback) {
  var $ = this;
  this._invalidate(url, function(err) {
    unirest.patch(url).form($._sanitize(entity)).end(callback);  
  });
}

Client.prototype.get = function(url, callback) {
  var $ = this;
  var start = new Date().getTime();
  this.redisClient.get(url, function(err, reply) {
    if (reply) {
      console.log("Getting from cache");
      $._printDuration(start);
      callback($._prepare(JSON.parse(reply)));
    } else {
      unirest.get(url).end(function (response) {
        var result, entity = response.body;
        if (entity.data) {
          result =[];
          for(var t=0;t<entity.data.length;t++) {
            var current = entity.data[t];
            result.push($._prepare(current));
          }
        } else {
          var primaryField = response.headers["x-mashape-primary"];
          if (primaryField) {
            entity[PRIMARY] = {
              field: primaryField
            }
          }
          $._cache(url, entity);
          result = $._prepare(entity);
        }
        $._printDuration(start);
        callback(result);
      });
    }
  });
}

Client.prototype._prepare = function(entity) {
  var $ = this;
	if (entity._links) {
		var refNames = Object.keys(entity._links)
		var length = refNames.length;
		var parent =  null;
		for(var i=0;i<length;i++) {
			var refName = refNames[i];
			var link = entity._links[refName];
			entity[refName] = (function (link) {
      		return function(callback, reload) {
            if (reload) {
              $._invalidate(link.href, function() {
                $.get(link.href, function(response) {
                  callback(response);
                });
              });
            } else {
              $.get(link.href, function(response) {
                callback(response);
              });
            }
          }
      })(link);
      if (link.parent) entity.parent = entity[refName];
      if (entity[PRIMARY]) entity.primary = (function (entity) {
        return function (callback) { 
          callback(entity[entity[PRIMARY].field])
        }
      })(entity);
		}
	}

  var url = entity._links["self"].href;

	entity.update = function(callback) {
    $.update(url, entity, callback);
	}

  entity.delete = function(callback) {
    $.delete(url, callback);
  }

	return entity;
}

Client.prototype._cache = function(url, entity) {
  this.redisClient.set(this._trim(url.toLowerCase().split("?")[0]), JSON.stringify(entity));
}

Client.prototype._invalidate = function(url, callback) {
  console.log("invalidating");
  this.redisClient.del(url, callback);
}

Client.prototype._sanitize = function(entity) {
  var $ = this;
  var toUpdate = entity;
  var fields = Object.keys(toUpdate);
  for(var i=0;i<fields.length;i++) {
    var field = fields[i];
    if (typeof(toUpdate[field]) == "function" || $._contains(RESERVED_FIELDS, field)) {
      delete toUpdate[field];
    }
  }
  return toUpdate;
}

Client.prototype.end = function() {
  this.redisClient.end();
}

Client.prototype._contains = function(a, obj) {
    var i = a.length;
    while (i--) {
       if (a[i] === obj) {
           return true;
       }
    }
    return false;
}

Client.prototype._trim = function(val) {
  return val.replace(/^\s+|\s+$/g, '');
};

Client.prototype._printDuration = function(start) {
  console.log("Took " + (new Date().getTime() - start) + "ms");
}

module.exports = Client;