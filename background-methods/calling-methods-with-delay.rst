Calling methods with delay
===========================

Sometimes you may want to postpone a method invocation; for example, to send an email to newly registered users a day after their registration. To do this, just call the ``BackgroundJob.Schedule`` method and pass the desired delay:

.. code-block:: c#

   BackgroundJob.Schedule(
       () => Console.WriteLine("Hello, world"),
       TimeSpan.FromDays(1));

:doc:`Hangfire Server <../background-processing/processing-background-jobs>` periodically checks the schedule to enqueue scheduled jobs to their queues, allowing workers to execute them. By default, check interval is equal to ``15 seconds``, but you can change it by setting the SchedulePollingInterval property on the options you pass to the ``BackgroundJobServer`` constructor:

.. code-block:: c#

  var options = new BackgroundJobServerOptions
  {
      SchedulePollingInterval = TimeSpan.FromMinutes(1)
  };

  var server = new BackgroundJobServer(options);

If you are processing your jobs inside an ASP.NET application, you should perform the following steps to ensure that your scheduled jobs get executed at the correct time:

* `Disable Idle Timeout <http://bradkingsley.com/iis7-application-pool-idle-time-out-settings/>`_ – set its value to ``0``.
* Use the `application auto-start <http://weblogs.asp.net/scottgu/auto-start-asp-net-applications-vs-2010-and-net-4-0-series>`_ feature.
