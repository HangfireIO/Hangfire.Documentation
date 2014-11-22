Performing recurrent tasks
===========================

Recurring job registration is pretty simple – you need to write only a single line of code in application initialization logic:

.. code-block:: c#

   RecurringJob.AddOrUpdate(() => Console.Write("Easy!"), Cron.Daily);

This line creates a new entry in the storage. Special component in Hangfire Server (see :doc:`../background-processing/processing-background-jobs`) will check the recurring jobs on a minute-based interval and enqueue them as fire-and-forget jobs, so you can track them as usual.

.. warning::

   Your Hangfire Server instance should be always on to perform scheduling and processing logic. If you perform the processing inside an ASP.NET application, please read also :doc:`../deployment-to-production/making-aspnet-app-always-running` chapter.

The ``Cron`` class contains different methods and overloads to run jobs on a minutely, hourly, daily, weekly, monthly and yearly basis. But you can use `CRON expressions <http://en.wikipedia.org/wiki/Cron#CRON_expression>`_ to specify more complex schedule:

.. code-block:: c#

   RecurringJob.AddOrUpdate(() => Console.Write("Powerful!"), "0 12 * */2");

Each recurring job has its own unique identifier. In previous examples it is being generated implicitly, using the type name and method name of the given method call expression (resulting in ``"Console.Write"``). The ``RecurringJob`` class contains other methods that take the recurring job identifier, so you can use define it explicitly to be able to use it later.

.. code-block:: c#

   RecurringJob.AddOrUpdate("some-id", () => Console.WriteLine(), Cron.Hourly);

The call to ``AddOrUpdate`` method will create a new recurring job or update existing job with the same identifier.

.. note::

   Recurring job identifier is **case sensitive** in some storage implementations.

You can remove existing recurring job by calling the ``RemoveIfExists`` method. It does not throw an exception, when there is no such recurring job.

.. code-block:: c#

   RecurringJob.RemoveIfExists("some-id");

To run a recurring job now, call the ``Trigger`` method. The information about triggered invocation will not be recorded to recurring job itself, and its next execution time will not be recalculated.

.. code-block:: c#

   RecurringJob.Trigger("some-id");

The ``RecurringJob`` class is a facade for the ``RecurringJobManager`` class. If you want some more power, consider to use it:

.. code-block:: c#

   var manager = new RecurringJobManager();
   manager.AddOrUpdate("some-id", Job.FromExpression(() => Method()), Cron.Yearly);
   
Example:
.. code-block:: c#
   public partial class Startup
   {
       public void Configuration(IAppBuilder app)
       {
           Hangfire.ConfigureHangfire(app);
           Hangfire.InitializeJobs();            
       }
   }

Example HangFire bootstrap class:
.. code-block:: c#
   public class Hangfire
   {
       public static void ConfigureHangfire(IAppBuilder app)
       {
           app.UseHangfire(config =>
           {
               config.UseSqlServerStorage("HangFireDB");
               config.UseServer();
               config.UseAuthorizationFilters(); //allow all users
           });
       }
   
       public static void InitializeJobs()
       {
         RecurringJob.AddOrUpdate("some-id", () => Console.WriteLine(), Cron.Hourly);
       }
   }
