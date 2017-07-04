Console Applications
=====================

In this tutorial I'll show you how to perform background processing in a console application. It is not necessary, because you can process background jobs directly in your :doc:`web application <aspnet-core-applications>`. But it is helpful, when you want to distribute the processing to another application, or want to have separate unit of deployment for background processing.

On Windows it is better to use :doc:`windows-services` instead of console applications, because they have well-established service control mechanism, such as autostart on boot, automatic restart and so on. But if you do want to run processing on other environments, such as `Microsoft Azure <https://azure.microsoft.com/>`_ via continuously running `WebJobs <https://docs.microsoft.com/en-us/azure/app-service-web/web-sites-create-web-jobs>`_ or on Linux via `daemon <https://en.wikipedia.org/wiki/Daemon_(computing)>`_ or `Docker <https://www.docker.com/>`_ container, console application is the best option.

Installing
-----------

Hangfire is available as a set of NuGet packages, so you need to add them to the ``*.csproj`` file by adding new ``PackageReference`` tags as below. Please note that versions in the code snippet below may be outdated, so use versions from the following badges, they are updated in real-time.

.. |latest-core| image:: https://img.shields.io/nuget/v/Hangfire.Core.svg?label=Hangfire.Core
.. |latest-sqlserver| image:: https://img.shields.io/nuget/v/Hangfire.SqlServer.svg?label=Hangfire.SqlServer

|latest-core| |latest-sqlserver| 

.. code-block:: xml
   :emphasize-lines: 8-11

   <Project Sdk="Microsoft.NET.Sdk">

     <PropertyGroup>
       <OutputType>Exe</OutputType>
       <TargetFramework>netcoreapp1.1</TargetFramework>
     </PropertyGroup>

     <ItemGroup>
       <PackageReference Include="Hangfire.Core" Version="1.6.*" />
       <PackageReference Include="Hangfire.SqlServer" Version="1.6.*" />
     </ItemGroup>

   </Project>

After updating dependencies and saving a file, you need to restore the packages in order to get them installed. In Visual Studio Code, the informational popup will appear just after saving, so click the ``Restore`` button, or run the ``dotnet restore`` command in terminal.

Configuring
------------

Modify the main method in the ``Program.cs`` file to configure Hangfire and start background processing as follows.

.. code-block:: c#

   static void Main(string[] args)
   {
       // Configure a storage and enable console logger
       GlobalConfiguration.Configuration
           .UseColouredConsoleLogProvider()
           .UseSqlServerStorage("Database=ConsoleApp31;Integrated Security=true");

       // Create a sample background job, you can safely remove this line
       BackgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

       // Start the background processing
       using (var waitHandler = new ManualResetEvent(false))
       using (new BackgroundJobServer())
       {
           Console.CancelKeyPress += (sender, eventArgs) => waitHandler.Set();
           Console.WriteLine("Background processing started. Press Ctrl+C to exit...");

           // Background processing will be stopped when Ctrl+C pressed
           waitHandler.WaitOne();
       }
   }

Then run the application. If everything is OK, you should see the following output.

.. code-block:: log

   2017-07-04 11:48:12 [INFO]  (Hangfire.SqlServer.SqlServerStorage) Start installing Hangfire SQL objects...
   2017-07-04 11:48:12 [INFO]  (Hangfire.SqlServer.SqlServerStorage) Hangfire SQL objects installed.
   2017-07-04 11:48:12 [INFO]  (Hangfire.BackgroundJobServer) Starting Hangfire Server
   2017-07-04 11:48:12 [INFO]  (Hangfire.BackgroundJobServer) Using job storage: 'SQL Server: ConsoleApp31'
   2017-07-04 11:48:12 [INFO]  (Hangfire.BackgroundJobServer) Using the following options for SQL Server job storage:
   2017-07-04 11:48:12 [INFO]  (Hangfire.BackgroundJobServer)     Queue poll interval: 00:00:15.
   2017-07-04 11:48:12 [INFO]  (Hangfire.BackgroundJobServer) Using the following options for Hangfire Server:
   2017-07-04 11:48:12 [INFO]  (Hangfire.BackgroundJobServer)     Worker count: 20
   2017-07-04 11:48:12 [INFO]  (Hangfire.BackgroundJobServer)     Listening queues: 'default'
   2017-07-04 11:48:12 [INFO]  (Hangfire.BackgroundJobServer)     Shutdown timeout: 00:00:15
   2017-07-04 11:48:12 [INFO]  (Hangfire.BackgroundJobServer)     Schedule polling interval: 00:00:15
   Background processing started. Press Ctrl+C to exit...
   Hello, world!

To stop the application, press :kbd:`Ctrl+C` for a graceful shutdown. Alternatively you can simply terminate a process by closing the terminal window, but in this case there may be additional delays in processing those background jobs, which were under processing when you terminate your application.

Processing Lifetime
--------------------

Your background jobs and recurring ones are processed only when your application is running, that's why it's important to know the processing lifetime. Graceful shutdown is another important topic, because it helps you to avoid unnecessary delays in background processing, that's why it is important to know how to start your application, and how to stop it.

When using console applications, background processing is started when console application is running. And it is stopped gracefully when you press :kbd:`Ctrl+C` on Windows, or sending the ``SIGINT`` on Linux. When console application is running in a Docker container or registered as a daemon, ensure ``SIGINT`` is configured as a termination signal, because default one, ``SIGTERM`` `isn't handled <https://github.com/dotnet/cli/issues/812>`_ by .NET Core runtime before 2.0.
