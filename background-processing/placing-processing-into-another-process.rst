Placing processing into another process
========================================

You may decide to move the processing to the different process from the main application. For example, your web application will only enqueue background jobs, leaving their performance to a Console application or Windows Service. First of all, let's overview the reasons for such decision.

Well scenarios
---------------

* Your background processing consumes **too much CPU or other resources**, and this decreases main application's performance. So you want to use separate machine for processing background jobs.
* You have long-running jobs that **are constantly being aborted** (retrying, aborted, retried again and so on) due to regular shutdowns of the main application. So you want to use separate process with increased lifetime (and you can't use :doc:`always running mode <../deployment-to-production/making-aspnet-app-always-running>` for your web application).
* *Do you have other suggestions? Please post them in the comment form below*.

You can stop processing background jobs in your main application by simply removing the instantiation of the ``BackgroundJobServer`` class (if you create it manually) or removing an invocation of the ``UseServer`` method from your OWIN configuration class.

After accomplishing the first step, you need to enable processing in another process, here are some guides:

* :doc:`Using Console applications <processing-jobs-in-console-app>`
* :doc:`Using Windows Services <processing-jobs-in-windows-service>`

.. note::

   Ensure that all of your Client/Servers use **the same job storage** and **have the same code base**. If client enqueues a job based on the ``SomeClass`` that is absent in server's code, the latter will simply throw a performance exception.

If this is a problem, your client may have references only to interfaces, whereas server provide implementations (please see the :doc:`../background-methods/using-ioc-containers` chapter).

Doubtful scenarios
-------------------

* You don't want to consume additional Thread Pool threads with background processing -- Hangfire Server uses **custom, separate and limited thread pool**.
* You are using Web Farm or Web Garden and don't want to face with synchronization issues -- Hangfire Server is **Web Garden/Web Farm friendly** by default.