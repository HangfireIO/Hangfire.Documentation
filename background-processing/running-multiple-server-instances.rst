Running multiple server instances
==================================

.. admonition:: Obsolete since 1.5
   :class: note
   
   You aren't required to have additional configuration to support multiple background processing servers in the same process since Hangfire 1.5, just skip the article. Server identifiers are now generated using GUIDs, so all the instance names are unique.

It is possible to run multiple server instances inside a process, machine, or on several machines at the same time. Each server use distributed locks to perform the coordination logic.

Each Hangfire Server has a unique identifier that consists of two parts to provide default values for the cases written above. The last part is a process id to handle multiple servers on the same machine. The former part is the *server name*, that defaults to a machine name, to handle uniqueness for different machines. Examples: ``server1:9853``, ``server1:4531``, ``server2:6742``.

Since the defaults values provide uniqueness only on a process level, you should handle it manually if you want to run different server instances inside the same process:

.. code-block:: c#

    var options = new BackgroundJobServerOptions
    {
        ServerName = String.Format(
            "{0}.{1}",
            Environment.MachineName,
            Guid.NewGuid().ToString())
    };

    var server = new BackgroundJobServer(options);

    // or
    
    app.UseHangfireServer(options);
