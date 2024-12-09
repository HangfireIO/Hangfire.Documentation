Using Redis
============

Hangfire with Redis job storage implementation processes jobs much faster than with SQL Server storage. On my development machine I observed more than 4x throughput improvement with empty jobs (method that does not do anything). ``Hangfire.Pro.Redis`` leverages the ``BRPOPLPUSH`` command to fetch jobs, so the job processing latency is kept to minimum.

.. image:: storage-compare.png
   :align: center

Redis ≥ 2.6.12 is required. Please, see the `downloads page <http://redis.io/download>`_ to obtain latest version of Redis. If you unfamiliar with this great storage, please see its `documentation <http://redis.io/documentation>`_. Binaries for Windows are available through NuGet (`32-bit <https://www.nuget.org/packages/Redis-32/>`_, `64-bit <https://www.nuget.org/packages/Redis-64/>`_) and Chocolatey galleries (`64-bit package <http://chocolatey.org/packages/redis-64>`_ only).

Limitations
------------

Multiple Redis endpoints are **only supported** in Redis Cluster configuration starting from `Hangfire.Pro.Redis 2.1.0 <https://www.hangfire.io/blog/2017/04/17/hangfire.pro.redis-2.1.0.html>`_. You can't use multiple detached masters or Redis Sentinel configurations.

Redis Configuration
--------------------

Please read the `official Redis documentation <http://redis.io/documentation>`_ to learn how to configure it, especially `Redis Persistence <http://redis.io/topics/persistence>`_ and `Redis Administration <http://redis.io/topics/admin>`_ sections to get started with the fundamentals. The following options should be configured to run your background jobs smoothly. 

.. admonition:: Ensure the following options are configured
   :class: warning

   These values are default for on-premise Redis installations, but other environments may have different defaults, for example **Azure Redis Cache** and **AWS ElastiCache** **use non-compatible settings** by default.  

.. code-block:: shell

   # Hangfire neither expect that non-expired keys are deleted,
   # nor expiring keys are evicted before the expiration time.
   maxmemory-policy noeviction

If you are planning to use the `Redis ACL <https://redis.io/docs/manual/security/acl/>`_ feature, below you can find a minimal supported set of rules you can specify to use Redis as a job storage. They restrict keyspace for regular and pub/sub commands to the default prefix used by Hangfire (``hangfire:``) and declare a minimal set of Redis commands used by Hangfire.Pro.Redis.

.. code-block:: shell

   resetkeys ~hangfire:* resetchannels &hangfire:* nocommands +info +ping +echo +select +cluster +time +@read +@write +@set +@sortedset +@list +@hash +@string +@pubsub +@transaction +@scripting

Installation
------------

Ensure that you have configured the private Hangfire Pro NuGet feed as `written here <https://www.hangfire.io/pro/downloads.html#configuring-feed>`_, and use your favorite NuGet client to install the ``Hangfire.Pro.Redis`` package:

.. code-block:: powershell

   PM> Install-Package Hangfire.Pro.Redis

If your project targets .NET Core, just add a dependency in your ``*.csproj`` file:

.. code-block:: xml

   <ItemGroup>
     <PackageReference Include="Hangfire.Pro.Redis" Version="3.*" />
   </ItemGroup>

Configuration
-------------

After installing the package, a couple of the ``UseRedisStorage`` extension method overloads will be available for the ``IGlobalConfiguration`` interface. They allow you to configure Redis job storage, using both *configuration string* and Hangfire-specific *options*.

Connection string
~~~~~~~~~~~~~~~~~

The basic one is the following, will connect to the Redis on *localhost* using the default port, database and options:

.. code-block:: csharp

   GlobalConfiguration.Configuration.UseRedisStorage();

For ASP.NET Core projects, call the ``UseRedisStorage`` method from the ``AddHangfire`` method delegate: 

.. code-block:: csharp

   services.AddHangfire(configuration => configuration.UseRedisStorage());

You can customize the connection string using the StackExchange.Redis' configuration string format. Please read `their documentation <https://stackexchange.github.io/StackExchange.Redis/Configuration>`_ for details. The values for the following options have their own defaults in Hangfire, but can be overridden in the *connection string*:

============================== ===========================
Option                         Default
============================== ===========================
``sslProtocols``               ``tls12``
``connectTimeout``             ``15000``
``syncTimeout``                ``30000``
``responseTimeout``            ``300000``
``keepAlive``                  ``60``
``allowAdmin``                 ``true``
``tieBreaker``                 ``String.Empty``
``configurationChannel``       ``String.Empty``
``preferIOCP``                 ``false``
``connectRetry``               ``0`` (external retries)
``abortOnConnectFail``         ``true`` (external retries)
============================== ===========================

.. code-block:: csharp

   GlobalConfiguration.Configuration
       .UseRedisStorage("contoso5.redis.cache.windows.net,abortConnect=false,ssl=true,password=...");

Redis Cluster support
~~~~~~~~~~~~~~~~~~~~~

You can use a single endpoint to connect to a Redis cluster, Hangfire will detect other instances automatically by querying the node configuration. However, it's better to pass multiple endpoints in order to mitigate connectivity issues, when some of endpoints aren't available, e.g. during the failover process.

Since Hangfire requires transactions, and Redis doesn't support ones that span multiple hash slots, you also need to configure the prefix to assign it to the same hash tag:

.. code-block:: csharp

   GlobalConfiguration.Configuration.UseRedisStorage(
       "localhost:6379,localhost:6380,localhost:6381",
       new RedisStorageOptions { Prefix = "{hangfire-1}:" });
       
This will bind all the keys to a single Redis instance. To be able to fully utilize your Redis cluster, consider using multiple ``JobStorage`` instances and leveraging some load-balancing technique (round-robin is enough for the most cases). To do so, pick different hash tags for different storages and ensure they are using hash slots that live on different masters by using commands ``CLUSTER NODES`` and ``CLUSTER KEYSLOT``.

Redis Sentinel support
~~~~~~~~~~~~~~~~~~~~~~

Starting from Hangfire.Pro.Redis 3.1.0, it is possible to connect to one or more Redis Sentinel instances, once `serviceName` parameter is specified in the connection string. Once connected, the client will determine the actual nodes for the specified service, and establish corresponding connections. In case of master changes, or connection problems with either Sentinel or regular Redis endpoints, connections will be automatically re-established.

.. code-block:: csharp

   GlobalConfiguration.Configuration.UseRedisStorage(
       "sentinel1:10000,sentinel2:10000,sentinel3:10000,serviceName=mymaster");

ElastiCache Serverless support
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

ElastiCache Serverless platform is supported via the new experimental transactions that are based on a single `EVAL` call to a Redis instance. Default transactions aren't supported by this platform due to a slightly different Redis protocol handling, which is unable to use `EVAL` commands in a `MULTI` blocks. So while the default transaction implementation offers better memory consumption for large transactions, Serverless solution is unable to use them.

.. code-block:: csharp

   GlobalConfiguration.Configuration.UseRedisStorage(
      "connection_string", new RedisStorageOptions
      {
          UseExperimentalTransactions = true
      });

Passing options
~~~~~~~~~~~~~~~

You can also pass the Hangfire-specific options for Redis storage by using the ``RedisStorageOptions`` class instances:

.. code-block:: csharp

   var options = new RedisStorageOptions
   {
       Prefix = "hangfire:app1:"
   };

   GlobalConfiguration.Configuration.UseRedisStorage("localhost", options);

The following options are available for configuration:

============================== ============================ ===========
Option                         Default                      Description
============================== ============================ ===========
Prefix                         ``hangfire:``                Prefix for all Redis keys related to Hangfire.
Database                       ``null``                     Redis database number to be used by Hangfire. When null, then the defaultDatabase option from the configuration string is used.
MaxSucceededListLength         ``10000``                    Maximum visible background jobs in the succeed list to prevent it from growing indefinitely.
MaxDeletedListLength           ``1000``                     Maximum visible background jobs in the deleted list to prevent it from growing indefinitely.
*InvisibilityTimeout*          ``TimeSpan.FromMinutes(30)`` **Obsolete since 2.4.0**
                                                            Time interval, within which background job is considered to be still successfully processed by a worker. When a timeout is elapsed, another worker will be able to pick the same background job.
*SubscriptionIntegrityTimeout* ``TimeSpan.FromHours(1)``    **Obsolete since 2.1.3**
                                                            Timeout for subscription-based fetch. The value should be high enough (hours) to decrease the stress on a database. This is an additional layer to provide integrity, because otherwise subscriptions can be active for weeks, and bad things may happen during this time.
============================== ============================ ===========

Using key prefixes
~~~~~~~~~~~~~~~~~~~

If you are using a shared Redis server for multiple environments, you can specify unique prefix for each environment:

.. code-block:: c#

   var options = new RedisStorageOptions
   {
       Prefix = "hangfire:"; // default value
   };

   GlobalConfiguration.Configuration.UseRedisStorage("localhost", 0, options);
