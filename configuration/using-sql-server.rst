Using SQL Server
=================

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

   Ensure your database doesn't use the snapshot isolation level, and the ``READ_COMMITTED_SNAPSHOT`` option (another name is *Is Read Committed Snapshot On*) **is disabled**. Otherwise some of your background jobs will not be processed, when MSMQ or RabbitMQ extensions are used. 

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

