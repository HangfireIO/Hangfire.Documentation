Using Redis
============

.. admonition:: Pro Only
   :class: note

   Starting from Hangfire 1.2, this feature is a part of `Hangfire Pro <http://hangfire.io/pro/>`_ package set

Hangfire with Redis job storage implementation processes jobs much faster than with SQL Server storage. On my development machine I observed more than 4x throughput improvement with empty jobs (method that does not do anything). ``Hangfire.Pro.Redis`` leverages the ``BRPOPLPUSH`` command to fetch jobs, so the job processing latency is kept to minimum.

.. image:: storage-compare.png
   :align: center

Please, see the `downloads page <http://redis.io/download>`_ to obtain latest version of Redis. If you unfamiliar with this great storage, please see its `documentation <http://redis.io/documentation>`_. 

Redis also supports Windows platform, but this is unofficial fork made by clever Microsoft guys. Here are GitHub repository branches for versions: `2.6 <https://github.com/MSOpenTech/redis/tree/2.6>`_, `2.8 <https://github.com/MSOpenTech/redis/tree/2.8>`_. Redis binaries are available through NuGet (`32-bit <https://www.nuget.org/packages/Redis-32/>`_, `64-bit <https://www.nuget.org/packages/Redis-64/>`_) and Chocolate galleries (`64-bit <http://chocolatey.org/packages/redis-64>`_ only). To install it as a Windows Service, check the `rgl/redis <https://github.com/rgl/redis>`_ repository, install it and update with binaries given above. *Don't use Redis 2.4 for Windows version for production environments (it is slow)*.

Configuration
--------------

Hangfire.Pro.Redis package contains some extension methods for the ``GlobalConfiguration`` class:

.. code-block:: c#

   GlobalConfiguration.Configuration
       // Use localhost:6370
       .UseRedisStorage();
       // Using hostname only and default port 6379
       .UseRedisStorage("localhost");
       // or specify a port
       .UseRedisStorage("localhost:6379");
       // or add a db number
       .UseRedisStorage("localhost:6379", 0);
       // or use a password
       .UseRedisStorage("password@localhost:6379", 0);

   // or with options
   var options = new RedisStorageOptions();
   GlobalConfiguration.Configuration
       .UseRedisStorage("localhost", 0, options);

Connection pool size
---------------------

Hangfire leverages connection pool to get connections quickly and shorten their usage. You can configure the pool size to match your environment needs:

.. code-block:: c#

   var options = new RedisStorageOptions
   {
       ConnectionPoolSize = 50 // default value
   };

   GlobalConfiguration.Configuration.UseRedisStorage("localhost", 0, options);

Using key prefixes
-------------------

If you are using a shared Redis server for multiple environments, you can specify unique prefix for each environment:

.. code-block:: c#

   var options = new RedisStorageOptions
   {
       Prefix = "hangfire:"; // default value
   };

   GlobalConfiguration.Configuration.UseRedisStorage("localhost", 0, options);