Overview
=========

Hangfire is an open-source framework designed for performing background processing in .NET. It allows you to kick off method calls outside of the current execution context by creating background jobs, in a simple but reliable way. All background jobs are persisted in SQL Server, Redis or any other supported storage, so you will not lose your jobs in case of a process shutdown: during deployments, server maintenance, or even unexpected termination. They will be automatically retried.

Framework allows to perform the processing in background threads of the same process (for example, ASP.NET application), in a separate process (for example, Windows Service), or on a completely different machine, since all the background jobs are serialized and persisted in a storage. And you can spread the processing across multiple servers without any additional configuration – all the work is synchronized using the storage.

Requirements
-------------

Hangfire works with the majority of .NET platforms: .NET Framework 4.5 or later, .NET Core 1.0 or later, any platform compatible with .NET Standard 1.3. You can integrate it with almost any application framework, including ASP.NET, ASP.NET Core, Console applications, Windows Services, WCF, as well as community-based like Nancy or ServiceStack.

Components
-----------

**Storage**

Storage is a place, where Hangfire keeps all the information related to background job processing. All the details like types, method names, arguments, etc. are serialized and placed into a storage, no data is kept in a process' memory. The storage subsystem is abstracted in Hangfire well enough to be implemented for RDBMS and NoSQL solutions.

This is the main decision you should made, and the only configuration required before start using the framework. The following example shows how to configure Hangfire against an SQL Server database. Please note that connection string may vary, depending on your environment.

.. code-block:: csharp

   GlobalConfiguration.Configuration
       .UseSqlServerStorage("Database=Hangfire.Sample; Integrated Security=True");

You can read more about the storage subsystem in the :doc:`corresponding article </storages/index>`.

**Client**

Client is responsible for creating background jobs and placing it to a storage. Background job is a unit of work that should be performed outside of the current execution context, e.g. in background thread, other process, or even on different server – all is possible with Hangfire, even with no additional configuration.

.. code-block:: csharp

   BackgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

Please note this is not a delegate, it's an *expression tree*. Instead of calling the method immediately, Hangfire serializes the type (``System.Console``), method name (``WriteLine``, with all the parameter types to identify it later), and all the given arguments, and places it to a storage.

Want to learn the details? See the :doc:`/creating-jobs/index` article.

**Server**

Hangfire Server is **processing background jobs** by querying storage data. Roughly speaking, it's a set of background threads that listen a storage for new background jobs, and performing them by deserializing type, method and arguments.

You can place background job server in any process you want, including `dangerous ones <http://haacked.com/archive/2011/10/16/the-dangers-of-implementing-recurring-background-tasks-in-asp-net.aspx/>`_ like ASP.NET – even if you terminate a process, your background jobs will be retried automatically after restart. So in basic configuration for web application, you don't need to use Windows Services for background processing anymore.

.. code-block:: csharp

   using (new BackgroundJobServer())
   {
       Console.ReadLine();
   }

Please see the :doc:`/processing-jobs/index` article for more details.

.. toctree::
   :maxdepth: 1
   :hidden:

   components
