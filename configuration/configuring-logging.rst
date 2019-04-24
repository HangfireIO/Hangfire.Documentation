Configuring logging
====================

Logging plays an important role in background processing, where work is performed behind the scenes. :doc:`Dashboard UI<using-dashboard>` can greatly help to reveal problems with user code, background jobs themselves. But it works by querying the job storage and requires the information is properly written first, before displaying it.

Even if Hangfire itself doesn't contain any errors, there may be connectivity issues, network blips, problems with the storage instance, different timeout issues and so on. And without logging it's very hard to diagnose those problems and understand what to do – exceptions are thrown in background and may get unnoticed.

Starting from Hangfire 1.3.0, you are **not required to do anything**, if your application already uses one of the following libraries through the reflection (so that Hangfire itself does not depend on any of them). Logging implementation is **automatically chosen** by checking for the presence of corresponding types in the order shown below.

1. `Serilog <http://serilog.net/>`_ 
2. `NLog <http://nlog-project.org/>`_
3. `Log4Net <https://logging.apache.org/log4net/>`_
4. `EntLib Logging <http://msdn.microsoft.com/en-us/library/ff647183.aspx>`_
5. `Loupe <http://www.gibraltarsoftware.com/Loupe>`_
6. `Elmah <https://code.google.com/p/elmah/>`_

If you want to log Hangfire events and have no logging library installed, please choose one of the above and refer to its documentation.

Console logger
---------------

For console applications and sandbox installations, there is the ``ColouredConsoleLogProvider`` class. You can start to use it by doing the following:

.. code-block:: csharp

   GlobalConfiguration.Configuration.UseColouredConsoleLogProvider();

Using a custom logger
-----------------------

It is very simple to add a custom logger implementation.  If your application uses another logging library that is not listed above, you only need to implement the following interfaces:

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

* **Trace** – for debugging Hangfire itself.
* **Debug** – to know why background processing does not work for you.
* **Info**  – to see that everything is working as expected: *Hangfire was started or stopped*, *Hangfire components performed useful work*. This is the **recommended** level to log.
* **Warn**  – to know learn about potential problems early: *performance failed, but automatic retry attempt will be made*, *thread abort exceptions*.
* **Error** – to know about problems that may lead to temporary background processing disruptions or problems you should know about: *performance failed, you need either to retry or delete a job manually*, *storage connectivity errors, automatic retry attempt will be made*.
* **Fatal** – to know that background job processing does not work partly or entirely, and requires manual intervention: *storage connectivity errors, retry attempts exceeded*, *different internal issues, such as OutOfMemoryException and so on*.
