Configuring logging
===================

Logging plays an important role in background processing, where work is performed behind the scenes. :doc:`Dashboard UI <using-dashboard>` can greatly help to reveal problems with user code, background jobs themselves. But it works by querying the job storage and requires the information is properly written first, before displaying it.

Even if Hangfire itself doesn't contain any errors, there may be connectivity issues, network blips, problems with the storage instance, different timeout issues and so on. And without logging it's very hard to diagnose those problems and understand what to do – exceptions are thrown in background and may get unnoticed.

Logging subsystem in Hangfire is abstracted by using the `LibLog <https://github.com/damianh/LibLog>`_ package to allow you to integrate it with any infrastructure. Also, you don't need to configure logging if your application doesn't create any background processing servers – client methods don't log anything, they just throw exceptions on errors.

.NET Core and ASP.NET Core
--------------------------

`Hangfire.NetCore <https://www.nuget.org/packages/Hangfire.NetCore/>`_ and `Hangfire.AspNetCore <https://www.nuget.org/packages/Hangfire.AspNetCore/>`_ packages provide the simplest way to integrate Hangfire into modern .NET Core applications. It delegates the logging implementation to the `Microsoft.Extensions.Logging <https://www.nuget.org/packages/Microsoft.Extensions.Logging>`_ package, so the only required method to call is the ``AddHangfire`` method:

.. code-block:: csharp
   :caption: Startup.cs

   public void ConfigureServices(IServiceCollection services)
   {
       // ...
       services.AddHangfire(config => config.UseXXXStorage());
   }

You can also change the minimal logging level for background processing servers to capture lifetime events like "server is starting" and "server is stopping" ones. These events are very important to debug cases when background processing isn't working, because all the processing servers are inactive.

.. code-block:: json
   :emphasize-lines: 5
   :caption: appsettings.json

   {
     "Logging": {
       "LogLevel": {
         "Default": "Warning",
         "Hangfire": "Information"
       }
     }
   }

Once integration is complete, please refer to the official `Logging in ASP.NET Core <https://docs.microsoft.com/en-us/aspnet/core/fundamentals/logging/>`_ article to learn how to configure the logging subsystem of .NET Core itself.

.NET Framework
---------------

If your application uses one of the following libraries, no manual action is required in the most cases. Hangfire knows about these loggers and uses reflection to determine the first available one (in the order defined below) and to call the corresponding methods when logging. And since reflection is used, there are no unnecessary package or assembly references.

1. `Serilog <https://serilog.net/>`_ 
2. `NLog <https://nlog-project.org/>`_
3. `Log4Net <https://logging.apache.org/log4net/>`_
4. `EntLib Logging <http://msdn.microsoft.com/en-us/library/ff647183.aspx>`_
5. `Loupe <http://www.gibraltarsoftware.com/Loupe>`_
6. `Elmah <https://elmah.github.io/>`_

Automatic wiring works correctly when your project references only a single logging package. Also, due to breaking changes (rare enough in the packages above), it's possible that wiring doesn't succeed. And to explicitly tell Hangfire what package to use to avoid the ambiguity, you can call one of the following methods (last invocation wins).

.. code-block:: csharp

   GlobalConfiguration.Configuration
       .UseSerilogLogProvider()
       .UseNLogLogProvider()
       .UseLog4NetLogProvider()
       .UseEntLibLogProvider()
       .UseLoupeLogProvider()
       .UseElmahLogProvider();

If your project doesn't have the required references when calling these methods, you may get a run-time exception.

Of course if you don't have any logging package installed or didn't configure it properly, Hangfire will not log anything, falling back to the internal ``NoOpLogger`` class. So it's a great time to install one, for example `Serilog <https://github.com/serilog/serilog/wiki/Getting-Started>`_, as it's the most simple logging package to set up.

Console logger
---------------

For simple applications you can use the built-in console log provider, please see the following snippet to learn how to activate it. But please ensure you aren't using it in production environments, because this logger may produce unwanted blocks, since global lock is obtained each time we are writing a message to ensure the colors are correct.

.. code-block:: csharp

   GlobalConfiguration.Configuration.UseColouredConsoleLogProvider();

Using a custom logger
-----------------------

If your application uses another logging library that's not listed above, you can implement your own logging adapter. Please see the following snippet to learn how to do this – all you need is to implement some interfaces and register the resulting log provider in a global configuration instance.

.. code-block:: csharp

   using Hangfire.Logging;

   public class CustomLogger : ILog
   {
       public string Name { get; set; }

       public bool Log(LogLevel logLevel, Func<string> messageFunc, Exception exception = null)
       {
           if (messageFunc == null)
           {
               // Before calling a method with an actual message, LogLib first probes
               // whether the corresponding log level is enabled by passing a `null`
               // messageFunc instance.
               return logLevel > LogLevel.Info;
           }

           // Writing a message somewhere, make sure you also include the exception parameter,
           // because it usually contain valuable information, but it can be `null` for regular
           // messages.
           Console.WriteLine(String.Format("{0}: {1} {2} {3}", logLevel, Name, messageFunc(), exception));

           // Telling LibLog the message was successfully logged.
           return true;
       }
   }

   public class CustomLogProvider : ILogProvider
   {
       public ILog GetLogger(string name)
       {
           // Logger name usually contains the full name of a type that uses it,
           // e.g. "Hangfire.Server.RecurringJobScheduler". It's used to know the
           // context of this or that message and for filtering purposes.
           return new CustomLogger { Name = name };
       }
   }

After implementing the interfaces above, call the following method:

.. code-block:: csharp

    GlobalConfiguration.Configuration.UseLogProvider(new CustomLogProvider());

Log level description
----------------------

There are the following semantics behind each log level. Please take into account that some logging libraries may have slightly other names for these levels, but usually they are almost the same. If you are looking for a good candidate for the minimal log level configuration in your application, choose the ``LogLevel.Info``.

============= ======================================================
Level         Description
============= ======================================================
``Trace``     These messages are for debugging Hangfire itself to see what events happened and what conditional branches taken.
``Debug``     Use this level to know why background processing does not work for you. There are no message count thresholds for this level, so you can use it when something is going wrong. But expect much higher number of messages, comparing to the next levels.
``Info``      This is the **recommended** minimal level to log from, to ensure everything is working as expected. 

              Processing server is usually using this level to notify about start and stop events – perhaps the most important ones, because inactive server doesn't process anything. Starting from this level, Hangfire tries to log as few messages as possible to not to harm your logging subsystem.
``Warn``      Background processing may be delayed due to some reason. You can take the corresponding action to minimize the delay, but there will be yet another automatic retry attempt anyway.
``Error``     Background process or job is unable to perform its work due to some external error which lasts for a long time. 

              Usually a message with this level is logged only after a bunch of retry attempts to ensure you don't get messages on transient errors or network blips. Also usually you don't need to restart the processing server after resolving the cause of these messages, because yet another attempt will be made automatically after some delay.
``Fatal``     Current processing server will not process background jobs anymore, and manual intervention is required.

              This log level is almost unused in Hangfire, because there are retries almost everywhere, except in the retry logic itself. Theoretically, ``ThreadAbortException`` may cause a fatal error, but only if it's thrown in a bad place –  usually thread aborts are being reset automatically.

              Please also keep in mind that we can't log anything if process is died unexpectedly.
============= ======================================================

