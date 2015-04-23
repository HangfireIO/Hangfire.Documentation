Configuring logging
====================

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

   LogProvider.SetCurrentLogProvider(new ColouredConsoleLogProvider());

Adding a custom logger
-----------------------

It is very simple to add a custom logger implementation.  If your application uses another logging library that is not listed above, you only need to implement the following interfaces:

.. code-block:: csharp

    public interface ILog
    {
        /// <summary>
        /// Log a message the specified log level.
        /// </summary>
        /// <param name="logLevel">The log level.</param>
        /// <param name="messageFunc">The message function.</param>
        /// <param name="exception">An optional exception.</param>
        /// <returns>true if the message was logged. Otherwise false.</returns>
        /// <remarks>
        /// Note to implementers: the message func should not be called if the loglevel is not enabled
        /// so as not to incur performance penalties.
        /// 
        /// To check IsEnabled call Log with only LogLevel and check the return value, no event will be written
        /// </remarks>
        bool Log(LogLevel logLevel, Func<string> messageFunc, Exception exception = null);
    }

    public interface ILogProvider
    {
        ILog GetLogger(string name);
    }

After implementing the interfaces above, call the following method:

.. code-block:: csharp

    LogProvider.SetCurrentLogProvider(new CustomLogProvider());

Log level description
----------------------

* **Trace** – for debugging Hangfire itself.
* **Debug** – to know why background processing does not work for you.
* **Info**  – to see that everything is working as expected: *Hangfire was started or stopped*, *Hangfire components performed useful work*. This is the **recommended** level to log.
* **Warn**  – to know learn about potential problems early: *performance failed, but automatic retry attempt will be made*, *thread abort exceptions*.
* **Error** – to know about problems that may lead to temporary background processing disruptions or problems you should know about: *performance failed, you need either to retry or delete a job manually*, *storage connectivity errors, automatic retry attempt will be made*.
* **Fatal** – to know that background job processing does not work partly or entirely, and requires manual intervention: *storage connectivity errors, retry attempts exceeded*, *different internal issues, such as OutOfMemoryException and so on*.
