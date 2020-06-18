Upgrading to Hangfire 1.7
=========================

.. admonition:: For Beta users
   :class: note

   If you are upgrading from beta versions, please follow the same steps as described here, and update your configuration only when all your instances already updated to the newest version.

Hangfire 1.7.0 brings a number of new features and great improvements for different aspects of background processing, including increased efficiency and better interoperability. We always consider backward compatibility when introducing new changes to ensure all the existing data can be processed by a newer version. 

But during upgrades in distributed environments it's also important to have the forward compatibility property, where older versions can co-exist with the newer ones without causing any troubles. In this case you can perform upgrades gradually, updating instances one-by-one without stopping the whole processing first.

Read the following sections carefully to minimize the risks during the upgrade process, but here are the main points:

1. You should call ``SetDataCompatibilityLevel(CompatibilityLevel.Version_170)`` and use other new features **only after** all of your servers migrated to the new version. Otherwise you will get only exceptions in the best case, or undefined behavior caused by custom serializer settings.
2. ``Schema 6`` and ``Schema 7`` migrations added to SQL Server, and you'll need to perform them either automatically or manually. Hangfire.SqlServer 1.6.23 is forward compatible with those schemas, and 1.7.0 is backward compatible with ``Schema 4`` (from version 1.5.0) and later.
3. New migrations for SQL Server will not be performed automatically unless ``EnableHeavyMigrations`` option is set. If your background processing is quite intensive, you should apply the migration manually with setting ``SINGLE_USER`` mode for the database to avoid deadlocks and reduce migration time.

If you have any issues with an upgrade process, please post your thoughts to `GitHub Issues <https://github.com/HangfireIO/Hangfire/issues>`_.

Data Compatibility
------------------

To allow further development without sacrificing forward compatibility, a new concept was added to version 1.7 – *Data Compatibility Level* that defines the format of the data that is written to a storage. It can be specified by calling the ``IGlobalConfiguration.SetDataCompatibilityLevel`` method and provides two options: ``CompatibilityLevel.Version_110`` (default value, every version starting from 1.1.0 understands it) and ``CompatibilityLevel.Version_170``.

The latest compatibility level contains the following changes:

* Background job payload is serialized using a more compact format.
* Serialization of internal data is performed with ``TypeNameHandling.Auto``, ``TypeNameAssemblyFormat.Simple``, ``DefaultValueHandling.IgnoreAndPopulate`` and ``NullValueHandling.Ignore`` settings that can't be affected by user settings set by ``UseSerializerSettings`` method and even by custom ``JsonConvert.DefaultOptions``.
* ``DateTime`` arguments are serialized using regular JSON serializer, instead of ``DateTime.ToString("o")`` method.

Backward Compatibility
~~~~~~~~~~~~~~~~~~~~~~

*Hangfire.Core, Hangfire.SqlServer*:

New version can successfully process background jobs created with both ``Version_110`` and ``Version_170`` data compatibility levels. However if you change the ``UseSerializerSettings`` with incompatible options, the resulting behavior is undefined.

*Hangfire.SqlServer:*

All queries are backward compatible even with ``Schema 5`` from versions 1.6.X, so you can run the schema migration manually after some time, for example during off-hours.

Forward Compatibility
~~~~~~~~~~~~~~~~~~~~~

.. admonition:: Warning
   :class: warning

   No new features or configuration options, except those mentioned in upgrade steps below, should be used to preserve the forward compatibility property.

*Hangfire.Core, Hangfire.SqlServer*:

Forward compatibility is supported on the ``CompatibilityLevel.Version_110`` (default value) data compatibility level. In this case no data in the new format will be created in the storage, and servers of previous versions will be possible to handle the new data.

*Hangfire.SqlServer:*

Hangfire.SqlServer 1.6.23 **is forward compatible** with ``Schema 6`` and ``Schema 7`` schemas. Previous versions don't support the new schemas and may lead to exceptions. Anyway it's better to upgrade all your servers first, and only then apply the migration.

Code Compatibility
------------------

Breaking Changes in API
~~~~~~~~~~~~~~~~~~~~~~~

Unfortunately there's need to update your code if you are using one of the following features during upgrade to the newest version. I understand such changes are not welcome when migrating between minor versions, but all of them are required to fix problems. These changes cover only the low level API surface and don't relate to background jobs.

*Hangfire.Core:*

* Added ``IBackgroundJobFactory.StateMachine`` property to enable transactional behavior of ``RecurringJobScheduler``.
* Changed the way of creating recurring job. ``CreatingContext.InitialState`` and ``CreatedContext.InitialState`` properties for ``IClientFilter`` implementations will return ``null`` now, instead of an actual value. Use ``IApplyStateFilter`` or ``IElectStateFilter`` to access that value.

*Hangfire.AspNetCore:*

* Removed registrations for ``IBackgroundJobFactory``, ``IBackgroundJobPerformer`` and ``IBackgroundJobStateChanger`` interfaces. Custom implementations of these interfaces now applied only if **all of them** are registered. Previously it was unclear what ``JobActivator`` is used – from registered service or from options, and lead to errors.

*Hangfire.SqlServer:*

* ``IPersistentJobQueueMonitoringApi.Get**JobIds`` methods now return ``IEnumerable<long>``. If you are using non-default persistent queue implementations, upgrade those packages as well. This change is required to handle bigger identifier format.

Breaking Changes in Code
~~~~~~~~~~~~~~~~~~~~~~~~

There are no breaking changes for your background jobs in this release, unless you explicitly changed the following configuration options.

* ``IGlobalConfiguration.UseRecommendedSerializerSettings`` (disabled by default) may affect argument serialization and may be incompatible with your current JSON settings if you've changed them using the ``JobHelper.SetSerializerSettings`` method or ``DefaultValueAttribute`` on your argument classes or different date/time formats.
* Setting ``BackgroundJobServerOptions.TaskScheduler`` to ``null`` (``TaskScheduler.Default`` is used by default) will force async continuations to be processed by the worker thread itself, reducing the number of required threads (that's good). But if you are using non-recommended and dangerous ``Task.Result`` or ``Task.GetAwaiter().GetResult()`` methods, your async background jobs can be deadlocked.

Upgrade Steps
---------------

.. admonition:: Steps related to the Hangfire.SqlServer package are optional
   :class: note

   This guide covers upgrade details also for the ``Hangfire.SqlServer`` package, because its versioning scheme is closely related to the ``Hangfire.Core`` package. If you are using another storage, simply skip information related to SQL Server, because nothing is changed for other storages in this release.

1. Upgrading Packages
~~~~~~~~~~~~~~~~~~~~~

First upgrade all the packages without touching any new configuration and/or new features. Then deploy your application with the new version until all your servers are successfully migrated to the newer version. 1.6.X and 1.7.0 servers can co-exist in the same environment just fine, thanks to forward compatibility.

a. Upgrade your NuGet package references using your own preferred way. If you've referenced Hangfire using a single meta-package, just upgrade it:

   .. |latest-core| image:: https://img.shields.io/nuget/v/Hangfire.Core.svg?label=Hangfire.Core

   |latest-core|

   .. code-block:: xml
       
      <PackageReference Include="Hangfire" Version="1.7.*" />

   If you reference individual packages upgrade them all, here is the full list of packages that come with this release. Please note that versions in the code snippet below may be outdated, so use versions from the following badges, they are updated in real-time.

   .. |latest-aspnetcore| image:: https://img.shields.io/nuget/v/Hangfire.AspNetCore.svg?label=Hangfire.AspNetCore
   .. |latest-sqlserver| image:: https://img.shields.io/nuget/v/Hangfire.SqlServer.svg?label=Hangfire.SqlServer
   .. |latest-sqlserver-msmq| image:: https://img.shields.io/nuget/v/Hangfire.SqlServer.Msmq.svg?label=Hangfire.SqlServer.Msmq

   |latest-core| |latest-aspnetcore| |latest-sqlserver| |latest-sqlserver-msmq| 

   .. code-block:: xml

      <PackageReference Include="Hangfire.Core" Version="1.7.*" />
      <PackageReference Include="Hangfire.AspNetCore" Version="1.7.*" />
      <PackageReference Include="Hangfire.SqlServer" Version="1.7.*" />
      <PackageReference Include="Hangfire.SqlServer.Msmq" Version="1.7.*" />

b. Fix breaking changes mentioned in the previous section if they apply to your use case.
c. (Optional) If your background processing sits mostly idle and you are already using Hangfire 1.6.23, you can run the schema migration for SQL Server during this step. Otherwise I'd highly encourage you to perform the migration manually as written in the following section, because it may take too long if there are outstanding queries.

   .. code-block:: csharp

      GlobalConfiguration.Configuration.UseSqlServerStorage("connection_string", new SqlServerStorageOptions
      {
          CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
          QueuePollInterval = TimeSpan.Zero,
          SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
          UseRecommendedIsolationLevel = true,
          PrepareSchemaIfNecessary = true, // Default value: true
          EnableHeavyMigrations = true     // Default value: false
      });

d. Set the ``StopTimeout`` for your background processing servers to give your background jobs some time to be processed during the shutdown event, instead of instantly aborting them.

   .. code-block:: csharp

      new BackgroundJobServerOptions
      {
          StopTimeout = TimeSpan.FromSeconds(10)
      }

2. Migrating the Schema
~~~~~~~~~~~~~~~~~~~~~~~

.. admonition:: Schema migration can be postponed to off-hours
   :class: note
   
   Hangfire.SqlServer 1.7 package can talk with all schemas, starting from ``Schema 4`` from version 1.5.0, so you can wait for some time before applying the new ones.

``Schema 6`` and ``Schema 7`` migrations that come with the new ``Hangfire.SqlServer`` package version will not be applied automatically, unless you set the ``EnableHeavyMigrations`` options as written above. This option was added to prevent uncontrolled upgrades that may lead to long downtime or deadlocks when applied in processing-heavy environments or during the peak load.

To perform the manual upgrade, obtain the `DefaultInstall.sql <https://github.com/HangfireIO/Hangfire/blob/27ab355ff1cd72a06af51fc6d2f4599a87c3b4b8/src/Hangfire.SqlServer/DefaultInstall.sql>`_ migration script from the repository and wrap it with the lines below to reduce the migration downtime. Please note this will abort all the current transactions and prevent new ones from starting until the upgrade is complete, so it's better to do it during off-hours.

.. code-block:: sql

   ALTER DATABASE [HangfireDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;

   -- DefaultInstall.sql / Install.sql contents

   ALTER DATABASE [HangfireDB] SET MULTI_USER;

If you are using non-default schema, please get the `Install.sql <https://github.com/HangfireIO/Hangfire/blob/27ab355ff1cd72a06af51fc6d2f4599a87c3b4b8/src/Hangfire.SqlServer/Install.sql>`_ file instead and replace all the occurrences of the ``$(HangFireSchema)`` token with your schema name without brackets.

3. Updating Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~

.. admonition:: Ensure all your processing servers upgraded to 1.7
   :class: Warning

   Before performing this step, ensure all your processing servers successfully migrated to the new version. Otherwise you may get exceptions or even undefined behavior, caused by custom JSON serialization settings.

When all your servers can understand the new features, you can safely enable them. The new version understands all the existing jobs even in previous data format, thanks to backward compatibility. All these settings are recommended, but optional – you can use whatever you have currently.

a. Set the new data compatibility level and type serializer to have more compact payloads for background jobs.

   .. code-block:: csharp

      GlobalConfiguration.Configuration
          // ...
          .SetDataCompatibilityLevel(CompatibilityLevel.Version_170)
          .UseSimpleAssemblyNameTypeSerializer();

b. If you don't use custom JSON settings before by calling ``JobHelper.SetSerializerSettings`` or by using ``JsonConvert.DefaultOption`` or by using attributes on your job argument classes, you can set the recommended JSON options that lead to more compact payloads. **Otherwise you can get breaking changes.**

   .. code-block:: csharp

      GlobalConfiguration.Configuration
          // ...
          .UseRecommendedSerializerSettings();

   If you do use custom settings, you can call the ``UseSerializerSettings`` method instead:

   .. code-block:: csharp

      GlobalConfiguration.Configuration  
          // ...
          .UseSerializerSettings(new JsonSerializerSettings { /* ... */ });
      

c. Update SQL Server options to have better locking scheme, more efficient dequeue when using Sliding Invisibility Timeout technique and disable heavy migrations in future to prevent accidental deadlocks.

   .. code-block:: csharp

      GlobalConfiguration.Configuration
          // ...
          .UseSqlServerStorage("connection_string", new SqlServerStorageOptions
          {
              // ...
              DisableGlobalLocks = true,    // Migration to Schema 7 is required 
              EnableHeavyMigrations = false // Default value: false
          });

After setting new configuration options, deploy the changes to your servers when needed.
