Documentation
==============

.. raw:: html
   :file: jumbotron.html

Hangfire is an open-source framework designed for performing background processing in .NET. It allows you to kick off method calls outside of the current execution context by creating background jobs, in a simple but reliable way. All background jobs are persisted in SQL Server, Redis or any other supported storage, so you will not lose your jobs in case of a process shutdown: during deployments, server maintenance, or even unexpected termination. They will be automatically retried.

Framework allows to perform the processing in background threads of the same process (for example, ASP.NET application), in a separate process (for example, Windows Service), or on a completely different machine, since all the background jobs are serialized and persisted in a storage. And you can spread the processing across multiple servers without any additional configuration – all the work is synchronized using the storage.

.. toctree::
   :hidden:
   :maxdepth: 2
   :titlesonly:
   :includehidden:

   getting-started/index
   storages/index
   creating-jobs/index
   designing-jobs/index
   processing-jobs/index
   monitoring/index
   environments/index
   tutorials/index
   