Using SQL Server
=================

.. admonition:: Under construction
   :class: warning

   SQL Server: overview (limitations, reliability), storage configuration (need to create database, recovery model and transactions, snapshot isolation and readcommitted_snapshot_on supported, async statistics for azure), hangfire configuration (transaction timeout in options, polling interval, schedule polling, schema configuration, isolation levels, queue priorities), dotnet configuration (transaction timeout, maxtimeout), msmq (limited role, transactional, create queues, local and remote queues, dtc/msmq type, maxtimeout, transition from sql, transaction is suppressed), maintenance and statistics (automatically, background activities, expiration, aggregating), versioning and migrations (automatic migrations, between minor versions, planning migrations), troubleshooting (connection pool size, timeouts, transaction timeouts, tune up azure). Transactions for client, existing connection, dtc warning, memory. Command timeout for batches and large arguments.


SQL Server is the default storage for Hangfire – it is well known to many .NET developers and used in many project environments. It may be interesting that in the early stage of Hangfire development, Redis was used to store information about jobs, and SQL Server storage implementation was inspired by that NoSql solution. But back to the SQL Server…

SQL Server storage implementation is available through the ``Hangfire.SqlServer`` NuGet package. To install it, type the following command in your NuGet Package Console window:

.. code-block:: powershell

   Install-Package Hangfire.SqlServer

This package is a dependency of the Hangfire's bootstrapper package ``Hangfire``, so if you installed it, you don't need to install the ``Hangfire.SqlServer`` separately – it was already added to your project.

.. admonition:: Supported database engines
   :class: note

   **Microsoft SQL Server 2008R2** (any edition, including LocalDB) and later, **Microsoft SQL Azure**.

.. admonition:: Snapshot isolation is not supported!
   :class: warning

   **Applies only to Hangfire < 1.5.9**: Ensure your database doesn't use the snapshot isolation level, and the ``READ_COMMITTED_SNAPSHOT`` option (another name is *Is Read Committed Snapshot On*) **is disabled**. Otherwise some of your background jobs will not be processed.

Configuration
--------------

The package provides extension methods for ``GlobalConfiguration`` class. Choose either a `connection string <https://www.connectionstrings.com/sqlconnection/>`_ to your SQL Server or a connection string name, if you have it.

.. code-block:: c#

   GlobalConfiguration.Configuration
       // Use connection string name defined in `web.config` or `app.config`
       .UseSqlServerStorage("db_connection")
       // Use custom connection string
       .UseSqlServerStorage(@"Server=.\sqlexpress; Database=Hangfire; Integrated Security=SSPI;");

Installing objects
~~~~~~~~~~~~~~~~~~~

Hangfire leverages a couple of tables and indexes to persist background jobs and other information related to the processing:

.. image:: sql-schema.png

Some of these tables are used for the core functionality, others fulfill the extensibility needs (making possible to write extensions without changing the underlying schema). Advanced objects like stored procedures, triggers and so on are not used to keep things as simple as possible and allow the library to be used with SQL Azure.

SQL Server objects are **installed automatically** from the ``SqlServerStorage`` constructor by executing statements described in the ``Install.sql`` file (which is located under the ``tools`` folder in the NuGet package). Which contains the migration script, so new versions of Hangfire with schema changes can be installed seamlessly, without your intervention.

If you want to install objects manually, or integrate it with your existing migration subsystem, pass your decision through the SQL Server storage options:

.. code-block:: c#

   var options = new SqlServerStorageOptions
   {
       PrepareSchemaIfNecessary = false
   };

   GlobalConfiguration.Configuration.UseSqlServerStorage("<name or connection string>", options);

Configuring the Polling Interval
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

One of the main disadvantage of raw SQL Server job storage implementation – it uses the polling technique to fetch new jobs. You can adjust the polling interval, but, as always, lower intervals can harm your SQL Server, and higher interval produce too much latency, so be careful. 

Please note that **millisecond-based intervals aren't supported**, you can only use intervals starting from *1 second*.

.. code-block:: c#

   var options = new SqlServerStorageOptions
   {
       QueuePollInterval = TimeSpan.FromSeconds(15) // Default value
   };

   GlobalConfiguration.Configuration.UseSqlServerStorage("<name or connection string>", options);

If you want to remove the polling technique, consider using the MSMQ extensions or Redis storage implementation.

SQL Server + MSMQ
------------------

`Hangfire.SqlServer.MSMQ <https://www.nuget.org/packages/Hangfire.SqlServer.MSMQ/>`_ extension changes the way Hangfire handles job queues. Default :doc:`implementation <using-sql-server>` uses regular SQL Server tables to organize queues, and this extensions uses transactional MSMQ queues to process jobs in a more efficient way:

================================ ================= =================
Feature                          Raw SQL Server    SQL Server + MSMQ
================================ ================= =================
Retry after process termination  Immediate after   Immediate after
                                 restart           restart
Worst job fetch time             Polling Interval  Immediate
                                 (15 seconds by
                                 default)
================================ ================= =================

So, if you want to lower background job processing latency with SQL Server storage, consider switching to using MSMQ.

Installation
-------------

MSMQ support for SQL Server job storage implementation, like other Hangfire extensions, is a NuGet package. So, you can install it using NuGet Package Manager Console window:

.. code-block:: powershell

   PM> Install-Package Hangfire.SqlServer.Msmq

Configuration
--------------

To use MSMQ queues, you should do the following steps:

1. **Create them manually on each host**. Don't forget to grant appropriate permissions. Please note that queue storage is limited to 1048576 KB by default (approximately 2 millions enqueued jobs), you can increase it through the MSMQ properties window. 
2. Register all MSMQ queues in current ``SqlServerStorage`` instance.

If you are using **only default queue**, call the ``UseMsmqQueues`` method just after ``UseSqlServerStorage`` method call and pass the path pattern as an argument.

.. code-block:: c#

    GlobalConfiguration.Configuration
        .UseSqlServerStorage("<connection string or its name>")
        .UseMsmqQueues(@".\hangfire-{0}");

To use multiple queues, you should pass them explicitly:

.. code-block:: c#

    GlobalConfiguration.Configuration
        .UseSqlServerStorage("<connection string or its name>")
        .UseMsmqQueues(@".\hangfire-{0}", "critical", "default");

Limitations
------------

* Only transactional MSMQ queues supported for reliability reasons inside ASP.NET.
* You can not use both SQL Server Job Queue and MSMQ Job Queue implementations in the same server (see below). This limitation relates to Hangfire Server only. You can still enqueue jobs to whatever queues and watch them both in Hangfire Dashboard.

Transition to MSMQ queues
--------------------------

If you have a fresh installation, just use the ``UseMsmqQueues`` method. Otherwise, your system may contain unprocessed jobs in SQL Server. Since one Hangfire Server instance can not process job from different queues, you should deploy :doc:`multiple instances <../background-processing/running-multiple-server-instances>` of Hangfire Server, one listens only MSMQ queues, another – only SQL Server queues. When the latter finish its work (you can see this in Dashboard – your SQL Server queues will be removed), you can remove it safely.

If you are using default queue only, do this:

.. code-block:: c#

    /* This server will process only SQL Server table queues, i.e. old jobs */
    var oldStorage = new SqlServerStorage("<connection string or its name>");
    var oldOptions = new BackgroundJobServerOptions
    {
        ServerName = "OldQueueServer" // Pass this to differentiate this server from the next one
    };

    app.UseHangfireServer(oldOptions, oldStorage);

    /* This server will process only MSMQ queues, i.e. new jobs */
    GlobalConfiguration.Configuration
        .UseSqlServerStorage("<connection string or its name>")
        .UseMsmqQueues(@".\hangfire-{0}");

    app.UseHangfireServer();

If you use multiple queues, do this:

.. code-block:: c#

    /* This server will process only SQL Server table queues, i.e. old jobs */
    var oldStorage = new SqlServerStorage("<connection string>");
    var oldOptions = new BackgroundJobServerOptions
    {
        Queues = new [] { "critical", "default" }, // Include this line only if you have multiple queues
        ServerName = "OldQueueServer" // Pass this to differentiate this server from the next one
    };

    app.UseHangfireServer(oldOptions, oldStorage);

    /* This server will process only MSMQ queues, i.e. new jobs */
    GlobalConfiguration.Configuration
        .UseSqlServerStorage("<connection string or its name>")
        .UseMsmqQueues(@".\hangfire-{0}", "critical", "default");

    app.UseHangfireServer();