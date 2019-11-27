ASP.NET Core Applications
=========================

Before we start with our tutorial, we need to have a working ASP.NET Core application. This documentation is devoted to Hangfire, please, read the official ASP.NET Core Documentation to learn the details on how to create and initialize a new web application: `Getting Started <https://docs.microsoft.com/en-us/aspnet/core/getting-started>`_ and `Tutorials <https://docs.microsoft.com/en-us/aspnet/core/tutorials/>`_.

Installing Hangfire
--------------------

Hangfire is available as a set of NuGet packages, so you need to add them to the ``*.csproj`` file by adding new ``PackageReference`` tags as below. Please note that versions in the code snippet below may be outdated, so use versions from the following badges, they are updated in real-time.

.. |latest-core| image:: https://img.shields.io/nuget/v/Hangfire.Core.svg?label=Hangfire.Core
.. |latest-aspnetcore| image:: https://img.shields.io/nuget/v/Hangfire.AspNetCore.svg?label=Hangfire.AspNetCore
.. |latest-sqlserver| image:: https://img.shields.io/nuget/v/Hangfire.SqlServer.svg?label=Hangfire.SqlServer

|latest-core| |latest-aspnetcore| |latest-sqlserver| 

.. code-block:: xml
   :emphasize-lines: 3-5

   <ItemGroup>
     <PackageReference Include="Microsoft.AspNetCore.App" />
     <PackageReference Include="Hangfire.Core" Version="1.7.0" />
     <PackageReference Include="Hangfire.SqlServer" Version="1.7.0" />
     <PackageReference Include="Hangfire.AspNetCore" Version="1.7.0" />
   </ItemGroup>

Creating a database
-------------------

As you can see from the snippet above, we'll be using SQL Server as a job storage in this article. Before configuring Hangfire, you'll need to create a database for it or use an existing one. Configuration strings below point to the ``HangfireTest`` database living in the ``SQLEXPRESS`` instance on a local machine.

You can use SQL Server Management Studio or any other way to execute the following SQL command. If you are using other database name or instance, ensure you've changed connection strings when configuring Hangfire during the next steps.

.. code-block:: sql

   CREATE DATABASE [HangfireTest]
   GO

Configuring Hangfire
---------------------

We'll start our configuration process with defining configuration string for ``Hangfire.SqlServer`` package. Consider you have an ``sqlexpress`` named instance running on localhost, and **just created the "HangfireTest" database**. Current user should be able to create tables, to allow automatic migrations to do their job.

Also, ``Hangfire.AspNetCore`` package has a logging integration with ASP.NET Core applications. Hangfire's log messages sometimes very important and help to diagnose different issues. ``Information`` level allows to see how Hangfire is working, and ``Warning`` and upper log level help to investigate problems.

Configuring Settings
~~~~~~~~~~~~~~~~~~~~

Open the ``appsettings.json`` file, and add the highlighted lines from the following snippet.

.. code-block:: json
   :emphasize-lines: 2-4,8

   {
     "ConnectionStrings": {
       "HangfireConnection": "Server=.\\sqlexpress;Database=HangfireTest;Integrated Security=SSPI;"
     },
     "Logging": {
       "LogLevel": {
         "Default": "Warning",
         "Hangfire": "Information"
       }
     }
   }

After updating the application settings, open the ``Startup.cs`` file. Startup class is the heart of ASP.NET Core application's configuration. First we need to import the ``Hangfire`` namespace.

.. code-block:: csharp
   :emphasize-lines: 3,4
   
   // ...
   using Microsoft.Extensions.DependencyInjection;
   using Hangfire;
   using Hangfire.SqlServer;

Registering Services
~~~~~~~~~~~~~~~~~~~~

Dependency Injection is one of the primary techniques introduced in ASP.NET Core. ``Hangfire.AspNetCore`` integration package adds an extension method to register all the services, their implementation, as well as logging and job activator. As a parameter, it takes an action that allows to configure Hangfire itself.

.. admonition:: Configuration settings below for new installations only
   :class: note

   Some of those settings can be incompatible with existing installations, please see the :doc:`Upgrade Guides <../upgrade-guides/index>` instead when upgrading to a newer version.

.. code-block:: csharp
   :emphasize-lines: 4-16, 19

   public void ConfigureServices(IServiceCollection services)
   {
       // Add Hangfire services.
       services.AddHangfire(configuration => configuration
           .SetDataCompatibilityLevel(CompatibilityLevel.Version_170)
           .UseSimpleAssemblyNameTypeSerializer()
           .UseRecommendedSerializerSettings()
           .UseSqlServerStorage(Configuration.GetConnectionString("HangfireConnection"), new SqlServerStorageOptions
           {
               CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
               SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
               QueuePollInterval = TimeSpan.Zero,           
               UseRecommendedIsolationLevel = true,
               UsePageLocksOnDequeue = true,
               DisableGlobalLocks = true
           }));

       // Add the processing server as IHostedService
       services.AddHangfireServer();

       // Add framework services. 
       services.AddMvc();
   }

Adding Dashboard UI
~~~~~~~~~~~~~~~~~~~

After registering Hangfire types, you can now choose features you need to add to your application. The following snippet shows you how to add the Dashboard UI to use all the Hangfire features immediately. The following lines are fully optional, and you can remove them completely, if your application will only create background jobs, while separate application will process them.

.. admonition:: Authorization configuration required for non-local requests
   :class: warning

   By default only local access is permitted to the Hangfire Dashboard. `Dashboard authorization <configuration/using-dashboard.html#configuring-authorization>`__ must be configured in order to allow remote access.

.. code-block:: csharp
   :emphasize-lines: 1,6,7

   public void Configure(IApplicationBuilder app, IBackgroundJobClient backgroundJobs, IHostingEnvironment env)
   {
       // ...
       app.UseStaticFiles();

       app.UseHangfireDashboard();
       backgroundJobs.Enqueue(() => Console.WriteLine("Hello world from Hangfire!"));

       app.UseMvc(routes =>
       {
           routes.MapRoute(
               name: "default",
               template: "{controller=Home}/{action=Index}/{id?}");
       });
   }

Running Application
--------------------

Run the following command in to to start an application, or click the :kbd:`F5` button in Visual Studio.

.. code-block:: bash
   
   dotnet run

After application is started, the following messages should appear, if background processing was started successfully. These lines contain messages regarding SQL Server Job Storage that is used to persist background jobs, and Background Job Server, that's processing all the background jobs.

.. code-block:: bash

    info: Hangfire.SqlServer.SqlServerStorage[0]
        Start installing Hangfire SQL objects...
        Hangfire SQL objects installed.
        Using job storage: 'SQL Server: .\@AspNetCoreTest'
        Using the following options for SQL Server job storage:
            Queue poll interval: 00:00:15.
    info: Hangfire.BackgroundJobServer[0]
        Starting Hangfire Server...
        Using the following options for Hangfire Server:
            Worker count: 20
            Listening queues: 'default'
            Shutdown timeout: 00:00:15
            Schedule polling interval: 00:00:15

The following message should also appear, since we created background job, whose only behavior is to write a message to the console.

.. code-block:: bash

   Hello world from Hangfire!

When application is started, open the following URL (assuming your app is running on the 5000 port) to access to the Hangfire Dashboard interface. As we can see, our background job was completed successfully.

.. code-block:: bash

   http://localhost:5000/hangfire

.. image:: first-job.png

When you finished working with the application, press the :kbd:`Ctrl+C` in your console window to stop the application. The following message should appear telling you that background processing server was stopped gracefully.

.. code-block:: bash

   info: Hangfire.BackgroundJobServer[0]
      Hangfire Server stopped.

You can also kill your process, but in this case some background jobs may be delayed in invocation.
