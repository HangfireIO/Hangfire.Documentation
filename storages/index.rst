Storages
=========

.. admonition:: Under construction
   :class: warning

   Storages: overview (persistence from start, at-least-once processing), choosing a storage (official, community-based), configuration (storage: reliability depends, hangfire: connection pools and worker count), architecture (scaling and distributed locks, sharding, one storage – one codebase recommendation, microservices and multi-tenant applications).

Hangfire is, unlike many other background processing frameworks, is designed with persistence in mind from start. It's not an optional feature, it's a requirement, to be able to preserve background jobs between process restart, and distribute the workload between diffirent servers. 

Storage is basically an abstraction that's define contracts for the following components, for background processing and monitoring needs:

* **Background job store**: serialized payloads, arguments, parameters, states – all the information required to perform a method in background.
* **Job queues**: efficient queue implementation with atomic fetch to support multiple producers/multiple consumers scenario with optional ordering and priority.
* **Distributed locks**: synchronization between different instances, since regular ``lock`` and ``Monitor`` facilities can not be used for synchronizing instances on different machines.
* **Data structures**: hashes, sets, lists and counters serve extensibility needs.
* **Monitoring API**: provides API for querying data to monitor the health and current status of background processing.

There are a lot of storage packages available in the Hangfire ecosystem: :doc:`Hangfire.SqlServer <sql-server>` and :doc:`Hangfire.Pro.Redis <redis>` are the only storages officially supported by Hangfire team, because it's hard to have an adequate expertise on all the storages. But there are a lot of community-driven storage implementations listed on the `Extensions page <http://hangfire.io/extensions.html#storages>`_.

Storage is the only required component to start the background processing using Hangfire, and should be configured before calling any other methods. Configuration logic should be performed once, during the application startup, using the ``GlobalConfiguration`` class:

.. code-block:: c#

   GlobalConfiguration.Configuration.UseStorage(new MyStorage());

.. toctree::
   :maxdepth: 1
   :hidden:

   sql-server
   redis
   custom-storages