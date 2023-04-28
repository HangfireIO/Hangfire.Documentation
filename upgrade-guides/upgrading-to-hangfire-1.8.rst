Upgrading to Hangfire 1.8
=========================

.. admonition:: For beta* and rc* users
   :class: note

   If you are upgrading from beta versions, please follow the same steps as described here, and update your configuration only when all your instances are already updated to the newest version.

Hangfire 1.8.0 offers a set of great new features like first-class queue support for background jobs, the enhanced role of the Deleted state that now supports exceptions, more options for continuations to implement even try/catch/finally semantics, better defaults to simplify the initial configuration and various Dashboard UI improvements like full-width and optional dark mode support.

We always consider backward compatibility when introducing changes to ensure a newer version can process all the existing data. But during upgrades in distributed environments, it's also essential to have the forward compatibility property, where older versions can co-exist with the newer ones without causing any trouble. In this case, you can perform upgrades gradually, updating instances one by one without stopping the processing entirely.

TL;DR
-----

Read the following sections carefully to minimize the risks during the upgrade process, but here are the main points:

1. You should set the compatibility level to ``CompatibilityLevel.Version_180`` and use other new features **only after** all your servers migrate to the latest version. Otherwise, you may get exceptions.
2. ``Schema 8`` and ``Schema 9`` migrations added to SQL Server, and running them automatically or manually is recommended.
3. New migrations for SQL Server will not be performed automatically unless the ``EnableHeavyMigrations`` option is set. If your background processing is quite intensive, you should apply the migration manually by setting the ``SINGLE_USER`` mode for the database to avoid deadlocks and reduce migration time.

If you have any issues with an upgrade process, please post them to `GitHub Issues <https://github.com/HangfireIO/Hangfire/issues>`_.

Data Compatibility
------------------

There's a concept of *Data Compatibility Level* that defines the format of the data that is written to storage to allow further development without sacrificing forward compatibility. The compatibility level can be specified by calling the ``IGlobalConfiguration.SetDataCompatibilityLevel`` method and providing a value of the ``CompatibilityLevel`` enum type.

The ``CompatibilityLevel.Version_180`` compatibility level contains the following change:

* ``CaptureCultureAttribute`` will not set ``CurrentUICulture`` parameter when it has the same value as the ``CurrentCulture`` one.

Backward Compatibility
~~~~~~~~~~~~~~~~~~~~~~

.. admonition:: Backward compatible with previous versions
   :class: note

   The new version can process data created by previous versions.

**Hangfire.Core, Hangfire.SqlServer**

The new version can successfully process background jobs created with any existing data compatibility level.

**Hangfire.SqlServer**

All queries are backward compatible even with ``Schema 5`` from versions 1.6.X, so you can run the schema migration manually after some time, for example, during off-hours.

Forward Compatibility
~~~~~~~~~~~~~~~~~~~~~

.. admonition:: Forward compatible with 1.6.X and 1.7.X
   :class: note

   Servers of the previous versions can process data created from this version. However, no new features or configuration options, except those mentioned in the upgrade steps below, should be used to preserve the forward compatibility property before all servers are upgraded.

**Hangfire.Core, Hangfire.SqlServer**

Forward compatibility is supported with previous ``CompatibilityLevel.Version_110`` (default value) and ``CompatibilityLevel.Version_170`` data compatibility levels. In this case, no data in the new format will be created in the storage, and servers of previous versions can handle the new data.

**Hangfire.SqlServer**

Hangfire.SqlServer 1.6.X and 1.7.X **are forward compatible** with the new ``Schema 8`` and ``Schema 9`` schemas. Previous versions don't support the new schemas and may lead to exceptions. Anyway, it's better to upgrade all your servers first and only then apply the migration.

Code Compatibility
------------------

The changes below cover upgrades from the 1.7.X versions. When upgrading from lower versions, please first check the :doc:`upgrading-to-hangfire-1.7` guide.

Breaking Changes in API
~~~~~~~~~~~~~~~~~~~~~~~

.. admonition:: Some changes may be required
   :class: warning

   Unfortunately, you may need to update your code if you use one of the following features during the upgrade to the newest version, especially if you use **SQL Server** as job storage.

**Hangfire.Core**

* Dropped `NET45` platform target in favor of `NET451` target to support Visual Studio 2022.
* Move the job to the `DeletedState` instead of `SucceededState` when a server filter cancels the execution.

**Hangfire.AspNetCore**

* Dropped the `NET45` platform target in favor of the `NET451` target to support Visual Studio 2022.
* Package is now based on ``Hangfire.NetCore`` to use the same types when both are referenced by the dependency graph.

**Hangfire.SqlServer**

* Dropped the `NET45` platform target in favor of the `NET451` target to support Visual Studio 2022.
* ``Microsoft.Data.SqlClient`` package will now be prefferred over the ``System.Data.SqlClient`` when both installed.
* Explicit reference to either ``Microsoft.Data.SqlClient`` or ``System.Data.SqlClient`` package is required.
* Sliding invisibility timeout-based fetching method is now used by default with a 5-minute timeout.

Breaking Changes in Code
~~~~~~~~~~~~~~~~~~~~~~~~

.. admonition:: No changes required
   :class: note

   There are no breaking changes for background processing in this release.

Upgrade Steps
---------------

Steps related to the Hangfire.SqlServer package are optional. This guide covers upgrade details also for the ``Hangfire.SqlServer`` package because its versioning scheme is closely related to the ``Hangfire.Core`` package. If you are using another storage, skip information related to SQL Server.

1. Upgrading Packages
~~~~~~~~~~~~~~~~~~~~~

First, upgrade all the packages without touching any new configuration and/or new features. Then deploy your application with the new version until all your servers are successfully migrated to the newer version. 1.6.X/1.7.X and 1.8.0 servers can co-exist in the same environment just fine, thanks to forward compatibility.

Upgrade your NuGet package references using your preferred way. If you've referenced Hangfire using a single meta-package, specify the newest version:

.. code-block:: xml
       
   <PackageReference Include="Hangfire" Version="1.8.*" />

If you reference individual packages, upgrade them all. Here is the list of packages that come with this release.

.. code-block:: xml

   <ItemGroup>
       <PackageReference Include="Hangfire.Core" Version="1.8.*" />
       <PackageReference Include="Hangfire.AspNetCore" Version="1.8.*" />
       <PackageReference Include="Hangfire.SqlServer" Version="1.8.*" /> <!-- Only if you are using it -->
   </ItemGroup>

2. Referencing the SQL Client Package
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The new version of the ``Hangfire.SqlServer`` comes with no explicit reference to the ``System.Data.SqlClient`` package to avoid using outdated versions and prefer using the new ``Microsoft.Data.SqlClient`` package by default when it's installed and used by other parts of the application.

If no other package references it, you can install it explicitly by modifying the ``*.csproj`` class and adding the package reference in the following way. Please note that there can be breaking changes in this package, compared to the old one, since the connection is encrypted by default since Microsoft.Data.SqlClient version 4.0.0.

.. code-block:: xml

   <ItemGroup>
       <PackageReference Include="Microsoft.Data.SqlClient" Version="*">
   </ItemGroup>

Suppose you'd prefer to keep the previous package instead for compatibility reasons. In that case, you can reference it explicitly and ensure that ``SqlClientFactory`` points to it just in case any other package caused ``Microsoft.Data.SqlClient`` to be installed, as shown below.

.. code-block:: xml

   <ItemGroup>
       <PackageReference Include="System.Data.SqlClient" Version="*">
   </ItemGroup>

Hangfire will attempt to determine what package to use automatically, depending on the actual package installed. If both packages are installed, then ``Microsoft.Data.SqlClient`` will be preferred, but you can specify what package to choose by using the ``SqlClientFactory`` property of the ``SqlServerStorageOptions`` class.

.. code-block:: csharp

   GlobalConfiguration.Configuration
       .UseSqlServerStorage("connection_string", new SqlServerStorageOptions
       {
           SqlClientFactory = System.Data.SqlClient.SqlClientFactory
           // or
           SqlClientFactory = Microsoft.Data.SqlClient.SqlClientFactory
       });

3. Migrating the Schema
~~~~~~~~~~~~~~~~~~~~~~~

.. admonition:: Schema migration can be postponed to off-hours
   :class: note
   
   Hangfire.SqlServer 1.8 package can talk with all schemas, starting from ``Schema 5`` from version 1.6, so you can wait for some time before applying the new ones.

Automatic migration
+++++++++++++++++++

Automatic migration is performed whenever the ``PrepareSchemaIfNecessary`` option is set (enabled by default). ``Schema 8`` and ``Schema 9`` migrations that come with the new ``Hangfire.SqlServer`` package version will not be applied automatically unless you set the ``EnableHeavyMigrations`` option (not enabled by default). This option was added to prevent uncontrolled upgrades that may lead to extended downtime or deadlocks when applied in processing-heavy environments or during the peak load.

.. code-block:: csharp

   GlobalConfiguration.Configuration
       .UseSqlServerStorage("connection_string", new SqlServerStorageOptions
       {
           // ...
           PrepareSchemaIfNecessary = true, // Enabled by default
           EnableHeavyMigrations = true     // Disabled by default
       })

Manual migration
++++++++++++++++

To perform the manual upgrade, obtain the `DefaultInstall.sql <https://github.com/HangfireIO/Hangfire/blob/27ab355ff1cd72a06af51fc6d2f4599a87c3b4b8/src/Hangfire.SqlServer/DefaultInstall.sql>`_ migration script from the repository and wrap it with the lines below to reduce the migration downtime. Please note this will abort all the current transactions and prevent new ones from starting until the upgrade is complete, so it's better to do it during off-hours.

.. code-block:: sql

   ALTER DATABASE [HangfireDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;

   -- DefaultInstall.sql / Install.sql contents

   ALTER DATABASE [HangfireDB] SET MULTI_USER;

If you are using non-default schema, please get the `Install.sql <https://github.com/HangfireIO/Hangfire/blob/27ab355ff1cd72a06af51fc6d2f4599a87c3b4b8/src/Hangfire.SqlServer/Install.sql>`_ file instead and replace all the occurrences of the ``$(HangFireSchema)`` token with your schema name without brackets.

3. Updating Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~

.. admonition:: Ensure all your processing servers upgraded to 1.8
   :class: Warning

   Before performing this step, ensure all your processing servers successfully migrated to the new version.

When all your servers can understand the new features, you can safely enable them. Thanks to backward compatibility, the new version understands all the existing jobs, even in the previous data format. All these settings are recommended but **optional** – you can use whatever you have currently.

.. code-block:: csharp

   GlobalConfiguration.Configuration
       .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
       // ... ;

4. Working with Deprecations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Deprecations are mainly related to recurring background jobs and are made to avoid confusion when explicit queue names are used.

Implicit Identifiers Deprecated
+++++++++++++++++++++++++++++++

Methods with implicit recurring job identifiers are now obsolete. While these methods make it easier to create a recurring job, sometimes they cause confusion when we use the same method to create multiple recurring jobs, but only a single one is created. With queues support for background jobs, there can be even more difficulties. So the following calls:

.. code-block:: csharp

   RecurringJob.AddOrUpdate(() => Console.WriteLine("Hi"), Cron.Daily);

Should be replaced with the following ones, where the first parameter determines the recurring job identifier:

.. code-block:: csharp

   RecurringJob.AddOrUpdate("Console.WriteLine", () => Console.WriteLine("Hi"), Cron.Daily);

For non-generic methods, the identifier is ``{TypeName}.{MethodName}``. For generic methods, it's much better to open the Recurring Jobs page in the Dashboard UI and check the identifier of the corresponding recurring job to avoid any mistakes.

Optional Parameters Deprecated
++++++++++++++++++++++++++++++

It is impossible to add new parameters to optional methods without introducing breaking changes. So to make the new explicit queues support consistent with other new methods in ``BackgroundJob`` / ``IBackgroundJobClient`` types, methods with optional parameters became deprecated. So the following lines:

.. code-block:: csharp

   RecurringJob.AddOrUpdate("my-id", () => Console.WriteLine("Hi"), Cron.Daily, timeZone: TimeZoneInfo.Local);

Should be replaced with an explicit RecurringJobOptions argument.

.. code-block:: csharp

   RecurringJob.AddOrUpdate("my-id", () => Console.WriteLine("Hi"), Cron.Daily, new RecurringJobOptions
   {
       TimeZone = TimeZoneInfo.Local
   });

The ``RecurringJobOptions.QueueName`` property is deprecated
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

New methods with an explicit queue name are suggested to use instead when support is added for your storage. This will also make re-queueing logic work as expected, with queueing to the same queue. So the following calls:

.. code-block:: csharp

   RecurringJob.AddOrUpdate("my-id", () => Console.WriteLine("Hi"), Cron.Daily, queue: "critical");

Should be replaced by these ones:

.. code-block:: csharp

   RecurringJob.AddOrUpdate("my-id", "critical", () => Console.WriteLine("Hi"), Cron.Daily);