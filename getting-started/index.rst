Getting Started
================

Requirements
-------------

Hangfire works with the majority of .NET platforms: .NET Framework 4.5 or later, .NET Core 1.0 or later, any platform compatible with .NET Standard 1.3. You can integrate it with almost any application framework, including ASP.NET, ASP.NET Core, Console applications, Windows Services, WCF, as well as community-driven like Nancy or ServiceStack.

Storage
--------

Storage is a place where Hangfire keeps all the information related to background job processing. All the details like types, method names, arguments, etc. are serialized and placed into a storage, no data is kept in a process' memory. The storage subsystem is abstracted in Hangfire well enough to be implemented for RDBMS and NoSQL solutions.

This is the main decision you should make, and the only configuration required before start using the framework. The following example shows how to configure Hangfire with an SQL Server database. Please note that connection string may vary, depending on your environment.

.. code-block:: csharp

   GlobalConfiguration.Configuration
       .UseSqlServerStorage(@"Server=.\SQLEXPRESS; Database=Hangfire.Sample; Integrated Security=True");

Client
-------

Client is responsible for creating background jobs and saving them in a storage. Background job is a unit of work that should be performed outside of the current execution context, e.g. in background thread, other process, or even on different server – all is possible with Hangfire, even with no additional configuration.

.. code-block:: csharp

   BackgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

Please note this is not a delegate, it's an *expression tree*. Instead of calling the method immediately, Hangfire serializes the type (``System.Console``), method name (``WriteLine``, with all the parameter types to identify it later), and all the given arguments, and places it to a storage.

Server
-------

Hangfire Server is processing background jobs by querying storage data. Roughly speaking, it's a set of background threads that listen a storage for new background jobs, and performing them by de-serializing type, method and arguments.

You can place background job server in any process you want, including `dangerous ones <http://haacked.com/archive/2011/10/16/the-dangers-of-implementing-recurring-background-tasks-in-asp-net.aspx/>`_ like ASP.NET – even if you terminate a process, your background jobs will be retried automatically after restart. So in basic configuration for web application, you don't need to use Windows Services for background processing anymore.

.. code-block:: csharp

   using (new BackgroundJobServer())
   {
       Console.ReadLine();
   }

Installation
-------------

Hangfire is distributed as a couple of NuGet packages, starting from the primary one, Hangfire.Core, that contains all the primary classes as well as abstractions. Other packages like Hangfire.SqlServer provide features or abstraction implementations. To start using Hangfire, install the primary package and choose one of the :doc:`available storages </storages/index>`.

After release of Visual Studio 2017, a completely new way of installing NuGet packages appeared. So I give up listing all the ways of installing a NuGet package, and fallback to the one available almost everywhere using the ``dotnet`` app.

.. code:: bash

   dotnet add package Hangfire.Core
   dotnet add package Hangfire.SqlServer

Configuration
--------------

Configuration is performed using the ``GlobalConfiguration`` class, its ``Configuration`` property provides a lot of extension method, both provided by Hangfire.Core, as well as other packages. If you install a new package, don't hesitate to check whether there are new extension methods. 

.. code-block:: c#

   GlobalConfiguration.Configuration
       .SetDataCompatibilityLevel(CompatibilityLevel.Version_170)
       .UseSimpleAssemblyNameTypeSerializer()
       .UseRecommendedSerializerSettings()
       .UseSqlServerStorage("Database=Hangfire.Sample; Integrated Security=True;", new SqlServerStorageOptions
       {
           CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
           SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
           QueuePollInterval = TimeSpan.Zero,           
           UseRecommendedIsolationLevel = true,
           UsePageLocksOnDequeue = true,
           DisableGlobalLocks = true
       })
       .UseBatches()
       .UsePerformanceCounters();

Method calls can be chained, so there's no need to use the class name again and again. Global configuration is made for simplicity, almost each class of Hangfire also allows you to specify overrides for storage, filters, etc. In ASP.NET Core environments global configuration class is hidden inside the ``AddHangfire`` method.

Usage
------

Here are all the Hangfire components in action, and it's fully working sample that prints the "Hello, world!" message from a background thread. You can comment the lines related to server, and run the program several times – all the background jobs will be processed as soon as you uncomment the lines again.

.. code-block:: c#

   using System;
   using Hangfire;
   using Hangfire.SqlServer;

   namespace ConsoleApplication2
   {
       class Program
       {
           static void Main()
           {
               GlobalConfiguration.Configuration
                   .SetDataCompatibilityLevel(CompatibilityLevel.Version_170)
                   .UseColouredConsoleLogProvider()
                   .UseSimpleAssemblyNameTypeSerializer()
                   .UseRecommendedSerializerSettings()
                   .UseSqlServerStorage("Database=Hangfire.Sample; Integrated Security=True;", new SqlServerStorageOptions
                   {
                       CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
                       SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
                       QueuePollInterval = TimeSpan.Zero,           
                       UseRecommendedIsolationLevel = true,
                       UsePageLocksOnDequeue = true,
                       DisableGlobalLocks = true
                   });

               BackgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

               using (var server = new BackgroundJobServer())
               {
                   Console.ReadLine();
               }
           }
       }
   }

.. toctree::
   :maxdepth: 1
   :hidden:

   aspnet-applications
   aspnet-core-applications
