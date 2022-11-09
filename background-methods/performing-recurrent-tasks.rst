Performing Recurrent Tasks
===========================

Recurring job registration is almost as simple as background job registration – you need to write a single line of code, but you also need to specify an identifier you can use to refer to your job later. The call to ``AddOrUpdate`` method will create a new recurring job or update existing job with the same identifier.

.. code-block:: c#

   RecurringJob.AddOrUpdate("easyjob", () => Console.Write("Easy!"), Cron.Daily);

This line creates a new entry in persistent storage. A special component in Hangfire Server (see :doc:`../background-processing/processing-background-jobs`) checks the recurring jobs on a minute-based interval and then enqueues them as fire-and-forget jobs. This enables you to track them as usual.

.. admonition:: Make sure your app is always running
   :class: warning

   Your Hangfire Server instance should be always on to perform scheduling and processing logic. If you perform the processing inside an ASP.NET application, please also read the :doc:`../deployment-to-production/making-aspnet-app-always-running` chapter.

The ``Cron`` class contains different methods and overloads to run jobs on a minute, hourly, daily, weekly, monthly and yearly basis. You can also use `CRON expressions <http://en.wikipedia.org/wiki/Cron#CRON_expression>`_ to specify a more complex schedule:

.. code-block:: c#

   RecurringJob.AddOrUpdate("powerfuljob", () => Console.Write("Powerful!"), "0 12 * */2");

.. admonition:: Identifiers should be unique
   :class: warning

   Use unique identifiers for each recurring job, otherwise you'll end with a single job.

.. admonition:: Identifiers may be case sensitive
   :class: note

   Recurring job identifier may be **case sensitive** in some storage implementations.

Manipulating recurring jobs
----------------------------

You can remove an existing recurring job by calling the ``RemoveIfExists`` method. It does not throw an exception when there is no such recurring job.

.. code-block:: c#

   RecurringJob.RemoveIfExists("some-id");

To run a recurring job now, call the ``Trigger`` method. The information about triggered invocation will not be recorded in the recurring job itself, and its next execution time will not be recalculated from this running.  For example, if you have a weekly job that runs on Wednesday, and you manually trigger it on Friday it will run on the following Wednesday.  

.. code-block:: c#

   RecurringJob.Trigger("some-id");

The ``RecurringJob`` class is a facade for the ``RecurringJobManager`` class. If you want some more power and responsibility, consider using it:

.. code-block:: c#

   var manager = new RecurringJobManager();
   manager.AddOrUpdate("some-id", Job.FromExpression(() => Method()), Cron.Yearly());
