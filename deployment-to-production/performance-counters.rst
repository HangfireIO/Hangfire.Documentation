Using Performance Counters
===========================

.. admonition:: Pro Only
   :class: note

   This feature is a part of `Hangfire Pro <https://www.hangfire.io/pro/>`_ package set

Performance Counters is a standard way to `measure <http://blogs.msdn.com/b/securitytools/archive/2009/11/04/how-to-use-perfmon-in-windows-7.aspx>`_ different application metrics on a Windows platform. This package enables Hangfire to publish performance counters so you can track them using different tools, including `Performance Monitor <http://technet.microsoft.com/en-us/library/cc749249.aspx>`_, `Nagios <http://www.nagios.org/>`_, `New Relic <http://newrelic.com/>`_ and others.

.. image:: perfmon.png

Installation
-------------

Before configuring Hangfire and starting to publish performance counters, you need to add them to *every machine* you use by running ``hangfire-perf.exe`` program with the ``ipc`` argument (for both install and update actions):

.. code-block:: powershell
 
   hangfire-perf ipc

To uninstall performance counters, use the ``upc`` command:

.. code-block:: powershell

   hangfire-perf upc

Configuration
--------------

Performance counters are exposed through the ``Hangfire.Pro.PerformanceCounters`` package. After adding it to your project, you need only to initialize them by invoking the following method:

.. code-block:: csharp

   using Hangfire.PerformanceCounters;

   PerformanceCounters.Initialize("unique-app-id");

Initialization logic is much easier within your OWIN Startup class:

.. code-block:: csharp

   using Hangfire.PerformanceCounters;

   public void Configure(IAppBuilder app)
   {
       app.UseHangfirePerformanceCounters();
   }
   
.. admonition:: Membership Configuration
   :class: note
   
   Also, ensure your IIS/ASP.NET user is a member of the "Performance Monitor Users" group. 

Performance counters
---------------------

Here is the list of performance counters currently exposed:

* Creation Process Executions
* Creation Process Executions/Sec
* Performance Process Executions
* Performance Process Executions/Sec
* Transitions to Succeeded State
* Transitions to Succeeded State/Sec
* Transitions to Failed State/Sec

Want more? Just open a `GitHub Issue <https://github.com/HangfireIO/Hangfire/issues/new>`_ and describe what metric you want to see.
