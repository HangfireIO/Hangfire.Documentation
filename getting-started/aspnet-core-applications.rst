ASP.NET Core Applications
==========================

.. admonition:: Under construction
   :class: warning

   ASP.NET Applications: in-process processing (no windows services), dangers of running (timeouts, deployments, no problems, enhanced shutdown detection), installation (hangfire.core, hangfire.aspnet), startup configuration (storage, authorization), implementation (ismssender, iemailsender), next steps (always-running tip, basic logging).


Before we start with our tutorial, we need to have a working ASP.NET Core application. This documentation is devoted to Hangfire, please, read the official ASP.NET Core Documentation to learn the details on how to create and initialize a new web application: `Getting Started <https://docs.microsoft.com/en-us/aspnet/core/getting-started>`_ and `Tutorials <https://docs.microsoft.com/en-us/aspnet/core/tutorials/>`_.

Here is the simplest available method, using the ``dotnet new`` command. After execution the following command, we'll have a sample ASP.NET Core application in the ``HelloHangfire`` folder. So, prepare your terminal, and let's play!

.. code-block:: bash

   mkdir HelloHangfire && cd HelloHangfire
   dotnet new mvc

Installing Hangfire
--------------------

Hangfire is available as a set of NuGet packages, so you need to add them to the ``*.csproj`` file by adding new ``PackageReference`` tags as below. Please note that versions in the code snippet below may be outdated, so use versions from the following badges, they are updated in real-time.

.. |latest-core| image:: https://img.shields.io/nuget/v/Hangfire.Core.svg?label=Hangfire.Core
.. |latest-aspnetcore| image:: https://img.shields.io/nuget/v/Hangfire.AspNetCore.svg?label=Hangfire.AspNetCore
.. |latest-sqlserver| image:: https://img.shields.io/nuget/v/Hangfire.SqlServer.svg?label=Hangfire.SqlServer

|latest-core| |latest-aspnetcore| |latest-sqlserver| 

.. code-block:: xml
   :emphasize-lines: 7-9

   <ItemGroup>
     <PackageReference Include="Microsoft.AspNetCore" Version="1.1.1" />
     <PackageReference Include="Microsoft.AspNetCore.Mvc" Version="1.1.2" />
     <PackageReference Include="Microsoft.AspNetCore.StaticFiles" Version="1.1.1" />
     <PackageReference Include="Microsoft.Extensions.Logging.Debug" Version="1.1.1" />
     <PackageReference Include="Microsoft.VisualStudio.Web.BrowserLink" Version="1.1.0" />
     <PackageReference Include="Hangfire.Core" Version="1.6.*" />
     <PackageReference Include="Hangfire.SqlServer" Version="1.6.*" />
     <PackageReference Include="Hangfire.AspNetCore" Version="1.6.*" />
   </ItemGroup>

After updating dependencies and saving a file, you need to restore the packages in order to get them installed. In Visual Studio Code, the informational popup will appear just after saving, so click the ``Restore`` button, or run the following command in the terminal.

.. code-block:: bash

   dotnet restore

Configuring Hangfire
---------------------

We'll start our configuration process with defining configuration string for ``Hangfire.SqlServer`` package. Consider you have an ``sqlexpress`` named instance running on localhost, and **just created the "AspNetCoreTest" database**. Current user *should be able to create tables*, to allow automatic migrations to do their job.

Also, ``Hangfire.AspNetCore`` package has a logging integration with ASP.NET Core applications. Hangfire's log messages sometimes very important and help to diagnose different issues. ``Information`` level allows to see how Hangfire is working, and ``Warning`` and upper log level help to investigate problems.

Open the ``appsettings.json`` file, and add the highlighted lines from the following snippet.

.. code-block:: json
   :emphasize-lines: 2-4,9

   {
     "ConnectionStrings": {
       "HangfireConnection": "Server=.\\sqlexpress;Database=AspNetCoreTest;Integrated Security=SSPI;"
     },
     "Logging": {
       "IncludeScopes": false,
       "LogLevel": {
         "Default": "Warning",
         "Hangfire": "Information"
       }
     }
   }

After updating the application settings, open the ``Startup.cs`` file. Startup class is the heart of ASP.NET Core application's configuration. First we need to import the ``Hangfire`` namespace.

.. code-block:: csharp
   :emphasize-lines: 4
   
   // ...
   using Microsoft.Extensions.DependencyInjection;
   using Microsoft.Extensions.Logging;
   using Hangfire;

Dependency Injection is one of the primary techniques introduced in ASP.NET Core. ``Hangfire.AspNetCore`` integration package adds an extension method to register all the services, their implementation, as well as logging and job activator. As a parameter, it takes an action that allows to configure Hangfire itself.

.. code-block:: csharp
   :emphasize-lines: 4-5

   public void ConfigureServices(IServiceCollection services)
   {
       // Add Hangfire services.
       services.AddHangfire(configuration => configuration
           .UseSqlServerStorage(Configuration.GetConnectionString("HangfireConnection")));

       // Add framework services. 
       services.AddMvc();
   }

After registering Hangfire types, you can now choose features you need to add to your application. The following snippet shows you how to add the Dashboard UI, and the background job server, to use all the Hangfire features now. The following lines are fully optional, and you can remove them completely, if your application will only create background jobs, while separate application will process them.

.. code-block:: csharp
   :emphasize-lines: 6-7

   public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
   {
       // ...
       app.UseStaticFiles();

       app.UseHangfireDashboard();
       app.UseHangfireServer();

       BackgroundJob.Enqueue(() => Console.WriteLine("Hello world from Hangfire!"));

       app.UseMvc(routes =>
       {
           routes.MapRoute(
               name: "default",
               template: "{controller=Home}/{action=Index}/{id?}");
       });
   }

Running Application
--------------------

Run the following command in to to start an application.

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
