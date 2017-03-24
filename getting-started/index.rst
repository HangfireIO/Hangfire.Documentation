Getting Started
================

.. admonition:: Under construction
   :class: warning

   Getting Started: framework, requirements (.net frameworks, persistent storage, json.net, application types, environments, ready for bad environments with at least once processing), packages (official, community, versioning, updating, highest dependency, NuGet version), basic usage (console app, global configuration (only once, startup, chain calls), client, server, comments). Strong naming via strongnamer.

In this article I'll describe a common aproach to start using the library, and give an overview of all the main Hangfire components – Client, Storage and Server. If you want to see more user-friendly approach in common environments, see the subsections.

Storage
--------

Storage is a place, where Hangfire keeps all the information related to background job processing. All the details like types, method names, arguments, etc. are serialized and placed into a storage, no data is kept in a process' memory. The storage subsystem is abstracted in Hangfire well enough to be implemented for RDBMS and NoSQL solutions.

This is the main decision you should made, and the only configuration required before start using the framework. The following example shows how to configure Hangfire against an SQL Server database. Please note that connection string may vary, depending on your environment.

.. code-block:: csharp

   GlobalConfiguration.Configuration
       .UseSqlServerStorage("Database=Hangfire.Sample; Integrated Security=True");

You can read more about the storage subsystem in the :doc:`corresponding article </storages/index>`.

Client
-------

Client is responsible for creating background jobs and placing it to a storage. Background job is a unit of work that should be performed outside of the current execution context, e.g. in background thread, other process, or even on different server – all is possible with Hangfire, even with no additional configuration.

.. code-block:: csharp

   BackgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

Please note this is not a delegate, it's an *expression tree*. Instead of calling the method immediately, Hangfire serializes the type (``System.Console``), method name (``WriteLine``, with all the parameter types to identify it later), and all the given arguments, and places it to a storage.

Want to learn the details? See the :doc:`/creating-jobs/index` article.

Server
-------

Hangfire Server is **processing background jobs** by querying storage data. Roughly speaking, it's a set of background threads that listen a storage for new background jobs, and performing them by deserializing type, method and arguments.

You can place background job server in any process you want, including `dangerous ones <http://haacked.com/archive/2011/10/16/the-dangers-of-implementing-recurring-background-tasks-in-asp-net.aspx/>`_ like ASP.NET – even if you terminate a process, your background jobs will be retried automatically after restart. So in basic configuration for web application, you don't need to use Windows Services for background processing anymore.

.. code-block:: csharp

   using (new BackgroundJobServer())
   {
       Console.ReadLine();
   }

Please see the :doc:`/processing-jobs/index` article for more details.

Requirements
-------------

Hangfire works with the majority of .NET platforms: .NET Framework 4.5 or later, .NET Core 1.0 or later, any platform compatible with .NET Standard 1.3. You can integrate it with almost any application framework, including ASP.NET, ASP.NET Core, Console applications, Windows Services, WCF, as well as community-based like Nancy or ServiceStack.

Installation
-------------

Hangfire is distributed as a couple of NuGet packages, starting from the primary one, Hangfire.Core, that contains all the primary classes as well as abstractions. Other packages like Hangfire.SqlServer providing features or abstraction implementations. To start using Hangfire, install the primary package and choose one of the :doc:`available storages </storages/index>`.

After release of Visual Studio 2017, a completely new way of installing NuGet packages appeared. So I give up listing all the ways of installing a NuGet package, and fallback to the Package Manager Console window commands everywhere in the documentation.

.. code:: powershell

   Install-Package Hangfire.Core
   Install-Package Hangfire.SqlServer

Usage
------

Here are all the Hangfire components in action. You can think that's too few lines code to be true, but it's fully working sample that prints the "Hello, world!" message from a background thread. You can comment the lines related to server, and run the program several times – all the background jobs will be processed as soon as you uncomment the lines again.

.. code-block:: c#
   :emphasize-lines: 2,10,11,13,15

   using System;
   using Hangfire;

   namespace ConsoleApplication2
   {
       class Program
       {
           static void Main()
           {
               GlobalConfiguration.Configuration
                   .UseSqlServerStorage("Database=Sample; Integrated Security=True");

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

   aspnet-mvc-applications
   aspnet-core-applications
   console-applications
   windows-services